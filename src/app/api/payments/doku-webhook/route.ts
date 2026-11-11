import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';
import { verifyDokuWebhookSignature, DOKU_CONFIG_DEFAULT } from '@/lib/doku';
import { getLocalDoc, setLocalDoc, addLocalCollectionDoc } from '@/lib/local-firestore-store';
import { dispatchUserNotification } from '@/lib/notifications-server';

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
    const localKeys = getLocalDoc('system/api_keys');
    if (localKeys.exists && localKeys.data?.dokuSecretKey) {
      secretKey = String(localKeys.data.dokuSecretKey);
    } else {
      try {
        const keysDoc = await db.collection('system').doc('api_keys').get();
        if (keysDoc.exists && keysDoc.data()?.dokuSecretKey) {
          secretKey = keysDoc.data()!.dokuSecretKey;
        }
      } catch (e) {}
    }

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

    // Ambil pending transaction dari Local Store atau Firestore
    const localPending = getLocalDoc(`doku_pending_transactions/${orderId}`);
    let pendingData: Record<string, any> | null = localPending.exists ? localPending.data : null;

    if (!pendingData) {
      try {
        const pendingRef = db.collection('doku_pending_transactions').doc(orderId);
        const pendingSnap = await pendingRef.get();
        if (pendingSnap.exists) pendingData = pendingSnap.data()!;
      } catch {}
    }

    if (!pendingData) {
      console.warn(`[DOKU Webhook] Pending record untuk ${orderId} tidak ditemukan.`);
      return NextResponse.json({ message: 'Order tidak ditemukan di pending list.' }, { status: 200 });
    }

    if (pendingData.status === 'success') {
      return NextResponse.json({ message: 'Order sudah berhasil dikreditkan sebelumnya.' }, { status: 200 });
    }

    const userId = pendingData.userId;
    const cryptoAmount = Number(pendingData.cryptoAmount || 0);
    const cryptoCurrency = pendingData.cryptoCurrency || 'ALX';
    const fiatAmount = Number(pendingData.amount || 0);
    const usdValue = String(pendingData.usdValue || '0');
    const nowIso = new Date().toISOString();

    const localUser = getLocalDoc(`users/${userId}`);
    if (localUser.exists && localUser.data && cryptoAmount > 0) {
      const nextCrypto = { ...(localUser.data.cryptoBalances || {}) };
      nextCrypto[cryptoCurrency] = Number(((Number(nextCrypto[cryptoCurrency] || 0)) + cryptoAmount).toFixed(8));
      setLocalDoc(`users/${userId}`, { cryptoBalances: nextCrypto }, true);
    }
    setLocalDoc(`doku_pending_transactions/${orderId}`, {
      status: 'success',
      settledAt: nowIso,
      paymentChannel: channelId,
      dokuPayload: payload,
    }, true);
    const localLiq = getLocalDoc('system/liquidity');
    setLocalDoc('system/liquidity', {
      totalFiatInjected: Number(localLiq.data?.totalFiatInjected || 0) + fiatAmount,
      totalUsdInjected: Number(localLiq.data?.totalUsdInjected || 0) + (parseFloat(usdValue) || 0),
      lastSettlementDate: nowIso,
      lastGateway: 'DOKU',
    }, true);
    addLocalCollectionDoc('system/audit/global_transactions', {
      id: `DOKU-${orderId}`,
      category: 'DOKU Checkout Instan',
      gateway: `DOKU (${channelId})`,
      amountIdr: fiatAmount,
      cryptoAmount,
      cryptoCurrency,
      status: 'success',
      timestamp: nowIso,
      userEmail: pendingData.customerEmail || '',
    });
    addLocalCollectionDoc(`users/${userId}/transactions`, {
      date: nowIso,
      description: `Beli ${cryptoCurrency} via DOKU (${channelId})`,
      category: 'Trading',
      amount: fiatAmount,
      cryptoAmount,
      cryptoCurrency,
      type: 'income',
      status: 'success',
      gateway: 'DOKU',
      orderId,
      timestamp: nowIso,
    });

    try {
      const pendingRef = db.collection('doku_pending_transactions').doc(orderId);
      await db.runTransaction(async (transaction) => {
        const userRef = db.collection('users').doc(userId);
        const userSnap = await transaction.get(userRef);

        if (userSnap.exists && cryptoAmount > 0) {
          const cryptoField = `cryptoBalances.${cryptoCurrency}`;
          transaction.update(userRef, {
            [cryptoField]: FieldValue.increment(cryptoAmount)
          });
        }
        transaction.update(pendingRef, {
          status: 'success',
          settledAt: FieldValue.serverTimestamp(),
          paymentChannel: channelId,
          dokuPayload: payload
        });
      });
    } catch {}

    console.log(`[DOKU Webhook] Sukses mengkreditkan ${cryptoAmount} ${cryptoCurrency} ke user ${userId} untuk order ${orderId}`);

    await dispatchUserNotification(userId, {
      title: `⚡ Pembayaran DOKU Sukses (${channelId})`,
      message: `Pembayaran Rp ${fiatAmount.toLocaleString('id-ID')} via DOKU berhasil diproses. ${cryptoAmount} ${cryptoCurrency} telah ditambahkan ke portofolio Anda.`,
      type: 'success',
      category: 'transaksi',
      amount: fiatAmount,
      cryptoAmount,
      cryptoCurrency,
      actionUrl: '/crypto',
    });

    return NextResponse.json({
      status: 'OK',
      message: 'Transaksi DOKU berhasil dikreditkan ke portofolio nasabah.'
    }, { status: 200 });

  } catch (error: any) {
    console.error('[DOKU Webhook Error]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

