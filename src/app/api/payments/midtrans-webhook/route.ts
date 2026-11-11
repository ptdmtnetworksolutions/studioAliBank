import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { getLocalDoc, setLocalDoc, addLocalCollectionDoc, queryLocalCollection } from '@/lib/local-firestore-store';
import { dispatchUserNotification } from '@/lib/notifications-server';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

async function getMidtransServerKey(): Promise<string> {
  if (process.env.MIDTRANS_SERVER_KEY) {
    return process.env.MIDTRANS_SERVER_KEY;
  }
  const localKeys = getLocalDoc('system/api_keys');
  if (localKeys.exists && localKeys.data?.midtransServerKey) {
    return String(localKeys.data.midtransServerKey);
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

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'OK', message: 'Midtrans Webhook active.' }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      // Empty body test ping
      return NextResponse.json({ status: 'OK', message: 'Test ping received.' }, { status: 200 });
    }

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      transaction_id,
      payment_type
    } = body || {};

    // Jika ini adalah test ping dari tombol "Tes URL Notifikasi" dashboard Midtrans
    if (!order_id || !signature_key || String(order_id).toLowerCase().includes('test') || String(order_id).toLowerCase().includes('sample')) {
      return NextResponse.json({ status: 'OK', message: 'Test notification received successfully.' }, { status: 200 });
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

    // Ambil data pending transaksi dari Local Store atau Firestore
    const localPending = getLocalDoc(`midtrans_pending_transactions/${order_id}`);
    let pendingData: Record<string, any> | null = localPending.exists ? localPending.data : null;

    if (!pendingData) {
      try {
        const pendingDocRef = db.collection('midtrans_pending_transactions').doc(order_id);
        const pendingSnap = await pendingDocRef.get();
        if (pendingSnap.exists) pendingData = pendingSnap.data()!;
      } catch {}
    }

    if (!pendingData) {
      console.warn(`[Midtrans Webhook] Pending doc order ${order_id} tidak ditemukan.`);
      return NextResponse.json({ message: 'Order tidak ditemukan di pending records, diabaikan.' });
    }

    if (pendingData.status === 'success') {
      return NextResponse.json({ message: 'Order sudah berhasil diproses sebelumnya.' });
    }

    const { userId, userEmail, cryptoAmount, cryptoCurrency, amountIdr, usdValue } = pendingData;
    const nowIso = new Date().toISOString();

    if (transaction_id) {
      const localDups = queryLocalCollection('system/audit/global_transactions', null, [], [], 200).filter((d) =>
        [`BUY-${transaction_id}`, `MIDTRANS-${transaction_id}`].includes(String(d.id))
      );
      if (localDups.length > 0) {
        setLocalDoc(`midtrans_pending_transactions/${order_id}`, {
          status: 'success',
          transactionId: transaction_id,
          paymentType: payment_type || '',
          completedAt: nowIso,
        }, true);
        return NextResponse.json({ message: 'Order sudah dikreditkan sebelumnya (duplikat diabaikan).' });
      }
    }

    // Update Local Store secara atomik
    const localUser = getLocalDoc(`users/${userId}`);
    if (localUser.exists && localUser.data) {
      const nextCrypto = { ...(localUser.data.cryptoBalances || {}) };
      nextCrypto[cryptoCurrency] = Number(((Number(nextCrypto[cryptoCurrency] || 0)) + parseFloat(cryptoAmount)).toFixed(8));
      setLocalDoc(`users/${userId}`, { cryptoBalances: nextCrypto }, true);
    }
    const localLiq = getLocalDoc('system/liquidity');
    setLocalDoc('system/liquidity', {
      totalUsdInjected: Number(localLiq.data?.totalUsdInjected || 0) + parseFloat(usdValue || '0'),
      totalFiatInjected: Number(localLiq.data?.totalFiatInjected || 0) + parseFloat(amountIdr),
    }, true);
    addLocalCollectionDoc('system/audit/global_transactions', {
      id: `MIDTRANS-${transaction_id || order_id}`,
      category: "Market Execution",
      gateway: "Midtrans Snap",
      paymentType: payment_type || "snap",
      amountIdr: parseFloat(amountIdr),
      cryptoAmount: parseFloat(cryptoAmount),
      cryptoCurrency: cryptoCurrency,
      status: "success",
      timestamp: nowIso,
      userEmail: userEmail || pendingData.customerEmail || ''
    });
    addLocalCollectionDoc(`users/${userId}/transactions`, {
      date: nowIso,
      description: `Beli ${cryptoCurrency} via Midtrans Snap (${payment_type || 'Kliring'})`,
      category: "Trading",
      amount: parseFloat(amountIdr),
      cryptoAmount: parseFloat(cryptoAmount),
      cryptoCurrency: cryptoCurrency,
      type: 'income',
      status: "success",
      gateway: "Midtrans Snap",
      transactionId: transaction_id,
      timestamp: nowIso
    });
    setLocalDoc(`midtrans_pending_transactions/${order_id}`, {
      status: 'success',
      transactionId: transaction_id || '',
      paymentType: payment_type || '',
      completedAt: nowIso
    }, true);

    try {
      const pendingDocRef = db.collection('midtrans_pending_transactions').doc(order_id);
      const userRef = db.collection('users').doc(userId);
      await db.runTransaction(async (transaction) => {
        const cryptoField = `cryptoBalances.${cryptoCurrency}`;
        transaction.update(userRef, {
          [cryptoField]: FieldValue.increment(parseFloat(cryptoAmount))
        });
        const liquidityRef = db.collection('system').doc('liquidity');
        transaction.update(liquidityRef, {
          totalUsdInjected: FieldValue.increment(parseFloat(usdValue || '0')),
          totalFiatInjected: FieldValue.increment(parseFloat(amountIdr))
        });
        transaction.update(pendingDocRef, {
          status: 'success',
          transactionId: transaction_id || '',
          paymentType: payment_type || '',
          completedAt: nowIso
        });
      });
    } catch {}

    await dispatchUserNotification(userId, {
      title: `⚡ Pembayaran Midtrans Sukses`,
      message: `Pembayaran Rp ${parseFloat(amountIdr).toLocaleString('id-ID')} via Midtrans Snap berhasil. ${cryptoAmount} ${cryptoCurrency} telah ditambahkan ke dompet Anda.`,
      type: 'success',
      category: 'transaksi',
      amount: parseFloat(amountIdr),
      cryptoAmount: parseFloat(cryptoAmount),
      cryptoCurrency: cryptoCurrency,
      actionUrl: '/crypto',
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
