import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

async function getIpaymuCredentials() {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    const snap = await adminDb.doc('system/api_keys').get();
    if (snap.exists) {
      const data = snap.data();
      return {
        ipaymuVa: data?.ipaymuVa || '',
        ipaymuApiKey: data?.ipaymuApiKey || '',
        ipaymuSandbox: data?.ipaymuSandbox ?? false
      };
    }
  } catch (e: any) {
    console.warn('[iPaymu Webhook] Admin SDK unavailable:', e?.code || e?.message?.slice(0, 80));
  }
  return { ipaymuVa: '', ipaymuApiKey: '', ipaymuSandbox: false };
}

async function verifyIpaymuTransaction(trxId: string, ipaymuVa: string, ipaymuApiKey: string, isProduction: boolean): Promise<boolean> {
  const checkUrl = isProduction
    ? 'https://my.ipaymu.com/api/v2/transaction'
    : 'https://sandbox.ipaymu.com/api/v2/transaction';

  const checkBody = {
    transactionId: trxId,
    account: ipaymuVa
  };

  const bodyString = JSON.stringify(checkBody);
  const bodyHash = crypto.createHash('sha256').update(bodyString).digest('hex');
  const stringToSign = `POST:${ipaymuVa}:${bodyHash}:${ipaymuApiKey}`;
  const signature = crypto.createHmac('sha256', ipaymuApiKey).update(stringToSign).digest('hex');
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);

  try {
    const res = await fetch(checkUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'va': ipaymuVa,
        'signature': signature,
        'timestamp': timestamp
      },
      body: bodyString
    });

    if (res.ok) {
      const json = await res.json();
      const responseStatus = json.Status !== undefined ? json.Status : json.status;
      // Status 1 in iPaymu means success/berhasil
      if (responseStatus === 200 && json.Data && (json.Data.Status === 1 || json.Data.Status === '1')) {
        return true;
      }
    }
  } catch (e) {
    console.error('Error verifying iPaymu transaction:', e);
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let params: any = {};

    if (contentType.includes('application/json')) {
      params = await request.json();
    } else {
      // Parse application/x-www-form-urlencoded
      const rawBody = await request.text();
      const searchParams = new URLSearchParams(rawBody);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }

    const { trx_id, status, reference_id, amount } = params;

    if (!trx_id || !status || !reference_id) {
      return NextResponse.json({ error: 'Data callback iPaymu tidak lengkap.' }, { status: 400 });
    }

    // Only process successful payments
    if (status !== 'berhasil' && status !== 'success') {
      return NextResponse.json({ message: 'Abaikan status non-success' });
    }

    const { ipaymuVa, ipaymuApiKey, ipaymuSandbox } = await getIpaymuCredentials();
    if (!ipaymuVa || !ipaymuApiKey) {
      return NextResponse.json({ error: 'Kredensial iPaymu belum diaktifkan.' }, { status: 500 });
    }

    const isProduction = !ipaymuSandbox;

    // Secure verification: check transaction status directly from iPaymu API
    const isVerified = await verifyIpaymuTransaction(trx_id, ipaymuVa, ipaymuApiKey, isProduction);
    if (!isVerified) {
      console.warn(`[iPaymu Webhook Warning]: Transaksi ${trx_id} tidak valid saat diverifikasi langsung.`);
      return NextResponse.json({ error: 'Verifikasi transaksi gagal.' }, { status: 400 });
    }

    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);

    // Retrieve pending transaction details from Firestore
    const pendingDocRef = db.collection('ipaymu_pending_transactions').doc(reference_id);
    const pendingSnap = await pendingDocRef.get();

    if (!pendingSnap.exists) {
      console.warn(`[iPaymu Webhook Warning]: Referensi order ${reference_id} tidak ditemukan.`);
      return NextResponse.json({ error: 'Referensi order tidak ditemukan.' }, { status: 404 });
    }

    const pendingData = pendingSnap.data()!;
    if (pendingData.status === 'success') {
      return NextResponse.json({ message: 'Order sudah berhasil diproses sebelumnya.' });
    }

    const { userId, userEmail, cryptoAmount, cryptoCurrency, amountIdr, usdValue } = pendingData;

    const userRef = db.collection('users').doc(userId);

    await db.runTransaction(async (transaction) => {
      // 1. Credit Crypto coins
      const cryptoField = `cryptoBalances.${cryptoCurrency}`;
      transaction.update(userRef, {
        [cryptoField]: FieldValue.increment(parseFloat(cryptoAmount))
      });

      // 2. Update Global Liquidity
      const liquidityRef = db.collection('system').doc('liquidity');
      transaction.update(liquidityRef, {
        totalUsdInjected: FieldValue.increment(parseFloat(usdValue)),
        totalFiatInjected: FieldValue.increment(parseFloat(amountIdr))
      });

      // 3. Record Global Audit Log
      const auditRef = db.collection('system').doc('audit').collection('global_transactions').doc();
      transaction.set(auditRef, {
        id: `IPAYMU-${trx_id}`,
        category: "Market Execution",
        gateway: "iPaymu",
        amountIdr: parseFloat(amountIdr),
        cryptoAmount: parseFloat(cryptoAmount),
        cryptoCurrency: cryptoCurrency,
        status: "success",
        timestamp: FieldValue.serverTimestamp(),
        userEmail: userEmail
      });

      // 4. Record User Transaction History
      const userTxRef = userRef.collection('transactions').doc();
      transaction.set(userTxRef, {
        date: new Date().toISOString(),
        description: `Beli ${cryptoCurrency} via iPaymu`,
        category: "Trading",
        amount: parseFloat(amountIdr),
        cryptoAmount: parseFloat(cryptoAmount),
        cryptoCurrency: cryptoCurrency,
        type: 'income',
        status: "success",
        timestamp: FieldValue.serverTimestamp()
      });

      // 5. Send In-App Notification
      const notifRef = userRef.collection('notifications').doc();
      transaction.set(notifRef, {
        title: `⚡ Pembayaran iPaymu Sukses`,
        message: `Pembayaran Rp ${parseFloat(amountIdr).toLocaleString('id-ID')} via iPaymu berhasil. ${cryptoAmount} ${cryptoCurrency} telah ditambahkan ke dompet Anda.`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString(),
        timestamp: FieldValue.serverTimestamp()
      });

      // 6. Update Pending Transaction Status
      transaction.update(pendingDocRef, {
        status: 'success',
        trxId: trx_id,
        completedAt: new Date().toISOString()
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook iPaymu berhasil diproses.'
    });

  } catch (err: any) {
    console.error('[iPaymu Webhook Error]:', err.message);
    return NextResponse.json({ error: err.message || 'Gagal memproses webhook iPaymu.' }, { status: 500 });
  }
}
