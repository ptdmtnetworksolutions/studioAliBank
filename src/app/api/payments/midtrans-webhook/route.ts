import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

async function getMidtransServerKey(): Promise<string> {
  if (process.env.MIDTRANS_SERVER_KEY) {
    return process.env.MIDTRANS_SERVER_KEY;
  }
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    const snap = await adminDb.doc('system/api_keys').get();
    if (snap.exists) {
      const key = snap.data()?.midtransServerKey;
      if (key) return key;
    }
  } catch (e: any) {
    console.warn('[Midtrans Webhook] Admin SDK unavailable:', e?.code || e?.message?.slice(0, 80));
  }
  return process.env.MIDTRANS_SERVER_KEY || '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      transaction_id,
      payment_type
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ error: 'Parameter webhook tidak lengkap.' }, { status: 400 });
    }

    const serverKey = await getMidtransServerKey();
    if (!serverKey) {
      return NextResponse.json({ error: 'Server Key Midtrans belum dikonfigurasi.' }, { status: 500 });
    }

    // Verifikasi Signature SHA512: order_id + status_code + gross_amount + ServerKey
    const rawSignature = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const expectedSignature = crypto.createHash('sha512').update(rawSignature).digest('hex');

    if (expectedSignature.toLowerCase() !== signature_key.toLowerCase()) {
      console.warn(`[Midtrans Webhook] Signature mismatch untuk order ${order_id}.`);
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 403 });
    }

    // Cek apakah status pembayaran sukses
    const isSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && (!fraud_status || fraud_status === 'accept'));

    if (!isSuccess) {
      return NextResponse.json({ 
        message: `Status transaksi '${transaction_status}' dicatat. Tidak ada aksi lanjutan.` 
      });
    }

    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);

    // Ambil data pending transaksi dari Firestore
    const pendingDocRef = db.collection('midtrans_pending_transactions').doc(order_id);
    const pendingSnap = await pendingDocRef.get();

    if (!pendingSnap.exists) {
      console.warn(`[Midtrans Webhook] Pending doc order ${order_id} tidak ditemukan.`);
      return NextResponse.json({ message: 'Order tidak ditemukan di pending records, diabaikan.' });
    }

    const pendingData = pendingSnap.data()!;
    if (pendingData.status === 'success') {
      return NextResponse.json({ message: 'Order sudah berhasil diproses sebelumnya.' });
    }

    const { userId, userEmail, cryptoAmount, cryptoCurrency, amountIdr, usdValue } = pendingData;
    const userRef = db.collection('users').doc(userId);

    await db.runTransaction(async (transaction) => {
      // 1. Tambah saldo koin crypto pengguna
      const cryptoField = `cryptoBalances.${cryptoCurrency}`;
      transaction.update(userRef, {
        [cryptoField]: FieldValue.increment(parseFloat(cryptoAmount))
      });

      // 2. Update Global Liquidity
      const liquidityRef = db.collection('system').doc('liquidity');
      transaction.update(liquidityRef, {
        totalUsdInjected: FieldValue.increment(parseFloat(usdValue || '0')),
        totalFiatInjected: FieldValue.increment(parseFloat(amountIdr))
      });

      // 3. Catat di Global Audit Log
      const auditRef = db.collection('system').doc('audit').collection('global_transactions').doc();
      transaction.set(auditRef, {
        id: `MIDTRANS-${transaction_id || order_id}`,
        category: "Market Execution",
        gateway: "Midtrans Snap",
        paymentType: payment_type || "snap",
        amountIdr: parseFloat(amountIdr),
        cryptoAmount: parseFloat(cryptoAmount),
        cryptoCurrency: cryptoCurrency,
        status: "success",
        timestamp: FieldValue.serverTimestamp(),
        userEmail: userEmail || pendingData.customerEmail || ''
      });

      // 4. Catat di Riwayat Transaksi Pengguna
      const userTxRef = userRef.collection('transactions').doc();
      transaction.set(userTxRef, {
        date: new Date().toISOString(),
        description: `Beli ${cryptoCurrency} via Midtrans Snap (${payment_type || 'Kliring'})`,
        category: "Trading",
        amount: parseFloat(amountIdr),
        cryptoAmount: parseFloat(cryptoAmount),
        cryptoCurrency: cryptoCurrency,
        type: 'income',
        status: "success",
        gateway: "Midtrans Snap",
        transactionId: transaction_id,
        timestamp: FieldValue.serverTimestamp()
      });

      // 5. Kirim Notifikasi Resmi ke Inbox Pengguna
      const notifRef = userRef.collection('notifications').doc();
      transaction.set(notifRef, {
        title: `⚡ Pembayaran Midtrans Sukses`,
        message: `Pembayaran Rp ${parseFloat(amountIdr).toLocaleString('id-ID')} via Midtrans Snap berhasil. ${cryptoAmount} ${cryptoCurrency} telah ditambahkan ke dompet Anda. Rekening penampungan: PT DMT Network Solutions.`,
        type: 'success',
        category: 'transaksi',
        read: false,
        createdAt: new Date().toISOString(),
        amount: parseFloat(amountIdr),
        cryptoAmount: parseFloat(cryptoAmount),
        cryptoCurrency: cryptoCurrency,
        timestamp: FieldValue.serverTimestamp()
      });

      // 6. Tandai pending transaction sebagai success
      transaction.update(pendingDocRef, {
        status: 'success',
        transactionId: transaction_id || '',
        paymentType: payment_type || '',
        completedAt: new Date().toISOString()
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook Midtrans berhasil diproses dan saldo dikreditkan.'
    });

  } catch (err: any) {
    console.error('[Midtrans Webhook Error]:', err?.message);
    return NextResponse.json(
      { error: err?.message || 'Gagal memproses webhook Midtrans.' },
      { status: 500 }
    );
  }
}
