import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';
import { verifyDokuWebhookSignature, DOKU_CONFIG_DEFAULT } from '@/lib/doku';

export const dynamic = 'force-dynamic';

function getAdminApp(): App | null {
  try {
    if (getApps().length > 0) return getApps()[0];
    return initializeApp({ projectId: firebaseConfig.projectId });
  } catch (e) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ACTIVE',
    service: 'DOKU Payment Gateway Webhook',
    merchant: 'PT DMT NETWORK SOLUTIONS',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ status: 'OK', message: 'Test ping parsed.' }, { status: 200 });
    }

    const clientId = request.headers.get('Client-Id') || '';
    const requestId = request.headers.get('Request-Id') || '';
    const requestTimestamp = request.headers.get('Request-Timestamp') || '';
    const signature = request.headers.get('Signature') || '';
    const requestTarget = '/api/payments/doku-webhook';

    // Dapatkan Order ID dan Status
    const orderId = payload.order?.invoice_number || payload.order?.id;
    const transactionStatus = payload.transaction?.status || payload.status;
    const channelId = payload.channel?.id || 'DOKU_PAYMENT';

    // Jika ini adalah test ping dari tombol Dashboard DOKU
    if (!orderId || String(orderId).toLowerCase().includes('test') || String(orderId).toLowerCase().includes('sample')) {
      return NextResponse.json({ status: 'OK', message: 'DOKU test notification received successfully.' }, { status: 200 });
    }

    const adminApp = getAdminApp();
    if (!adminApp) {
      return NextResponse.json({ error: 'Database Admin tidak tersedia.' }, { status: 500 });
    }

    const db = getFirestore(adminApp);

    // Ambil Secret Key untuk verifikasi
    let secretKey = DOKU_CONFIG_DEFAULT.secretKey;
    try {
      const keysDoc = await db.collection('system').doc('api_keys').get();
      if (keysDoc.exists && keysDoc.data()?.dokuSecretKey) {
        secretKey = keysDoc.data()!.dokuSecretKey;
      }
    } catch (e) {}

    // Verifikasi Signature jika header Signature dikirim
    if (signature) {
      const isValid = verifyDokuWebhookSignature({
        clientId: clientId || DOKU_CONFIG_DEFAULT.clientId,
        requestId,
        requestTimestamp,
        requestTarget,
        rawBody,
        incomingSignature: signature,
        secretKey
      });

      if (!isValid) {
        console.warn(`[DOKU Webhook] Signature mismatch untuk order: ${orderId}`);
      }
    }

    // Cek apakah status pembayaran SUCCESS
    const isSuccess = String(transactionStatus).toUpperCase() === 'SUCCESS';

    if (!isSuccess) {
      return NextResponse.json({
        message: `Status transaksi '${transactionStatus}' dicatat. Tidak ada pengkreditan aset.`
      }, { status: 200 });
    }

    // Ambil pending transaction
    const pendingRef = db.collection('doku_pending_transactions').doc(orderId);
    const pendingSnap = await pendingRef.get();

    if (!pendingSnap.exists) {
      console.warn(`[DOKU Webhook] Pending record untuk ${orderId} tidak ditemukan.`);
      return NextResponse.json({ message: 'Order tidak ditemukan di pending list.' }, { status: 200 });
    }

    const pendingData = pendingSnap.data()!;
    if (pendingData.status === 'success') {
      return NextResponse.json({ message: 'Order sudah berhasil dikreditkan sebelumnya.' }, { status: 200 });
    }

    const userId = pendingData.userId;
    const cryptoAmount = Number(pendingData.cryptoAmount || 0);
    const cryptoCurrency = pendingData.cryptoCurrency || 'ALX';
    const fiatAmount = Number(pendingData.amount || 0);
    const usdValue = String(pendingData.usdValue || '0');

    // Jalankan Transaction untuk mengkreditkan kripto ke user dan mencatat audit
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const userSnap = await transaction.get(userRef);

      if (userSnap.exists && cryptoAmount > 0) {
        const cryptoField = `cryptoBalances.${cryptoCurrency}`;
        transaction.update(userRef, {
          [cryptoField]: FieldValue.increment(cryptoAmount)
        });
      }

      // Tandai order sukses
      transaction.update(pendingRef, {
        status: 'success',
        settledAt: FieldValue.serverTimestamp(),
        paymentChannel: channelId,
        dokuPayload: payload
      });

      // Update Liquidity Escrow Perusahaan PT DMT Network Solutions
      const liquidityRef = db.collection('system').doc('liquidity');
      transaction.update(liquidityRef, {
        totalFiatInjected: FieldValue.increment(fiatAmount),
        totalUsdInjected: FieldValue.increment(parseFloat(usdValue) || 0),
        lastSettlementDate: FieldValue.serverTimestamp(),
        lastGateway: 'DOKU'
      });

      // Audit Transaksi Global
      const auditRef = db.collection('system').doc('audit').collection('global_transactions').doc();
      transaction.set(auditRef, {
        id: `DOKU-${orderId}`,
        category: 'DOKU Checkout Instan',
        gateway: `DOKU (${channelId})`,
        amountIdr: fiatAmount,
        cryptoAmount,
        cryptoCurrency,
        userId,
        status: 'SUCCESS',
        timestamp: FieldValue.serverTimestamp(),
        reference: orderId
      });
    });

    console.log(`[DOKU Webhook] Sukses mengkreditkan ${cryptoAmount} ${cryptoCurrency} ke user ${userId} untuk order ${orderId}`);

    return NextResponse.json({
      status: 'OK',
      message: 'Transaksi DOKU berhasil dikreditkan ke portofolio nasabah.'
    }, { status: 200 });

  } catch (error: any) {
    console.error('[DOKU Webhook Error]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
