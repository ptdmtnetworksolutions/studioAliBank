import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';
import { createDokuCheckout, checkDokuOrderStatus, DOKU_CONFIG_DEFAULT, DokuConfig } from '@/lib/doku';
import { getLocalDoc, setLocalDoc, addLocalCollectionDoc } from '@/lib/local-firestore-store';
import { dispatchUserNotification } from '@/lib/notifications-server';
import { validateCryptoAmountAgainstIdr } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

const INVOICE_PATH_REGEX = /^merchants\/[a-zA-Z0-9_-]+\/invoices\/[a-zA-Z0-9_-]+$/;

function getAdminApp(): App | null {
  try {
    if (getApps().length > 0) return getApps()[0];
    return initializeApp({ projectId: firebaseConfig.projectId });
  } catch {
    return null;
  }
}

async function resolveDokuConfig(): Promise<DokuConfig> {
  const config: DokuConfig = { ...DOKU_CONFIG_DEFAULT };
  const localKeys = getLocalDoc('system/api_keys');
  if (localKeys.exists && localKeys.data) {
    const kData = localKeys.data;
    if (kData.dokuClientId) config.clientId = kData.dokuClientId;
    if (kData.dokuSecretKey) config.secretKey = kData.dokuSecretKey;
    if (kData.dokuApiKey) config.apiKey = kData.dokuApiKey;
    if (kData.dokuIsProduction !== undefined) config.isProduction = Boolean(kData.dokuIsProduction);
  }

  try {
    const adminApp = getAdminApp();
    if (adminApp) {
      const db = getFirestore(adminApp);
      const keysSnap = await db.collection('system').doc('api_keys').get();
      if (keysSnap.exists) {
        const kData = keysSnap.data();
        if (kData?.dokuClientId) config.clientId = kData.dokuClientId;
        if (kData?.dokuSecretKey) config.secretKey = kData.dokuSecretKey;
        if (kData?.dokuApiKey) config.apiKey = kData.dokuApiKey;
        if (kData?.dokuIsProduction !== undefined) config.isProduction = Boolean(kData.dokuIsProduction);
      }
    }
  } catch (err) {
    console.warn('[DOKU Config] Firestore Admin fallback to default:', err);
  }

  return config;
}

/**
 * POST /api/payments/doku-checkout
 * Menghasilkan Payment Link DOKU Checkout resmi untuk PT DMT Network Solutions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      amount,
      customerName,
      customerEmail,
      userId,
      cryptoAmount,
      cryptoCurrency,
      usdValue,
      paymentMethodTypes,
      paymentChannel,
      callbackUrl,
      invoiceId,
      invoicePath,
      isMarketplaceItem
    } = body;

    if (!orderId || !amount || !customerName) {
      return NextResponse.json({ error: 'Parameter transaksi tidak lengkap.' }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 5_000_000_000) {
      return NextResponse.json({ error: 'Nominal transaksi tidak valid.' }, { status: 400 });
    }
    if (cryptoAmount != null && cryptoCurrency && !validateCryptoAmountAgainstIdr(String(cryptoCurrency), Number(cryptoAmount), parsedAmount)) {
      return NextResponse.json({ error: 'Nominal konversi aset kripto tidak sesuai dengan nilai IDR.' }, { status: 400 });
    }

    const config = await resolveDokuConfig();
    const methodTypes = Array.isArray(paymentMethodTypes)
      ? paymentMethodTypes.filter((v: any) => typeof v === 'string' && v.trim().length > 0)
      : undefined;

    const pendingDoc = {
      orderId,
      amount: parsedAmount,
      customerName,
      customerEmail: customerEmail || '',
      userId: userId || '',
      cryptoAmount: Number(cryptoAmount || 0),
      cryptoCurrency: cryptoCurrency || (invoiceId ? 'IDR' : 'ALX'),
      usdValue: String(usdValue || '0'),
      paymentChannel: paymentChannel || 'doku',
      paymentMethodTypes: methodTypes || [],
      invoiceId: invoiceId || '',
      invoicePath: invoicePath || '',
      isMarketplaceItem: Boolean(isMarketplaceItem),
      status: 'pending',
      createdAt: new Date().toISOString(),
      gateway: 'DOKU Checkout'
    };
    setLocalDoc(`doku_pending_transactions/${orderId}`, pendingDoc, true);

    try {
      const adminApp = getAdminApp();
      if (adminApp) {
        const db = getFirestore(adminApp);
        await db.collection('doku_pending_transactions').doc(orderId).set(pendingDoc, { merge: true });
      }
    } catch (dbErr) {
      console.warn('[DOKU Checkout] Warning recording pending doc:', dbErr);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alibank.tarroz.com';
    let safeCallbackUrl = `${appUrl}/crypto/buy?status=success&orderId=${encodeURIComponent(orderId)}`;
    if (invoiceId) {
      safeCallbackUrl = `${appUrl}/checkout/${encodeURIComponent(String(invoiceId))}?status=success&orderId=${encodeURIComponent(orderId)}`;
    } else if (typeof callbackUrl === 'string' && callbackUrl.startsWith(appUrl)) {
      safeCallbackUrl = callbackUrl;
    }

    const checkoutResult = await createDokuCheckout(
      {
        orderId,
        amount: parsedAmount,
        customerName,
        customerEmail: customerEmail || 'nasabah@alibank.id',
        callbackUrl: safeCallbackUrl,
        paymentMethodTypes: methodTypes
      },
      config
    );

    if (!checkoutResult.success || !checkoutResult.paymentUrl) {
      return NextResponse.json({
        error: checkoutResult.error || 'Gagal menghasilkan sesi DOKU Checkout.'
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      orderId,
      paymentUrl: checkoutResult.paymentUrl
    });
  } catch (error: any) {
    console.error('[DOKU Route Error]', error);
    return NextResponse.json({
      error: error.message || 'Terjadi kesalahan internal server saat menghubungi DOKU.'
    }, { status: 500 });
  }
}

/**
 * GET /api/payments/doku-checkout?orderId=...
 * Memverifikasi status order ke DOKU Orders API dan melakukan settlement idempoten.
 */
export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('orderId')?.trim();
    if (!orderId) {
      return NextResponse.json({ error: 'Parameter orderId wajib diisi.' }, { status: 400 });
    }

    const config = await resolveDokuConfig();
    const localPending = getLocalDoc(`doku_pending_transactions/${orderId}`);
    let pendingData: Record<string, any> | null = localPending.exists ? localPending.data : null;

    const adminApp = getAdminApp();
    const db = adminApp ? getFirestore(adminApp) : null;

    if (!pendingData && db) {
      try {
        const snap = await db.collection('doku_pending_transactions').doc(orderId).get();
        if (snap.exists) pendingData = snap.data() || null;
      } catch {}
    }

    const statusResult = await checkDokuOrderStatus(orderId, config);
    if (!statusResult.success) {
      return NextResponse.json({
        success: false,
        orderId,
        transactionStatus: pendingData?.status === 'success' ? 'SUCCESS' : 'PENDING',
        settled: pendingData?.status === 'success',
        alreadySettled: pendingData?.status === 'success',
        error: statusResult.error
      }, { status: 200 });
    }

    const txStatus = statusResult.transactionStatus || 'PENDING';
    if (txStatus !== 'SUCCESS') {
      return NextResponse.json({
        success: true,
        orderId,
        transactionStatus: txStatus,
        settled: pendingData?.status === 'success',
        alreadySettled: pendingData?.status === 'success',
        cryptoAmount: Number(pendingData?.cryptoAmount || 0),
        cryptoCurrency: pendingData?.cryptoCurrency || 'ALX',
        amount: Number(pendingData?.amount || statusResult.amount || 0),
        invoiceId: pendingData?.invoiceId || '',
        invoicePath: pendingData?.invoicePath || '',
        channelId: statusResult.channelId || ''
      });
    }

    if (pendingData?.status === 'success') {
      return NextResponse.json({
        success: true,
        orderId,
        transactionStatus: 'SUCCESS',
        settled: true,
        alreadySettled: true,
        cryptoAmount: Number(pendingData.cryptoAmount || 0),
        cryptoCurrency: pendingData.cryptoCurrency || 'ALX',
        amount: Number(pendingData.amount || statusResult.amount || 0),
        invoiceId: pendingData.invoiceId || '',
        invoicePath: pendingData.invoicePath || '',
        channelId: pendingData.paymentChannel || statusResult.channelId || 'DOKU'
      });
    }

    const nowIso = new Date().toISOString();
    const userId = String(pendingData?.userId || '');
    const cryptoAmount = Number(pendingData?.cryptoAmount || 0);
    const cryptoCurrency = String(pendingData?.cryptoCurrency || 'ALX');
    const fiatAmount = Number(pendingData?.amount || statusResult.amount || 0);
    const usdValue = String(pendingData?.usdValue || '0');
    const channelId = statusResult.channelId || pendingData?.paymentChannel || 'DOKU';
    const invoiceId = String(pendingData?.invoiceId || '');
    const invoicePath = String(pendingData?.invoicePath || '');

    setLocalDoc(
      `doku_pending_transactions/${orderId}`,
      {
        status: 'success',
        settledAt: nowIso,
        paymentChannel: channelId,
        dokuStatusPayload: statusResult.rawData || {}
      },
      true
    );

    if (userId && cryptoAmount > 0) {
      const localUser = getLocalDoc(`users/${userId}`);
      if (localUser.exists && localUser.data) {
        const nextCrypto = { ...(localUser.data.cryptoBalances || {}) };
        nextCrypto[cryptoCurrency] = Number(((Number(nextCrypto[cryptoCurrency] || 0)) + cryptoAmount).toFixed(8));
        setLocalDoc(`users/${userId}`, { cryptoBalances: nextCrypto }, true);
      }

      const localLiq = getLocalDoc('system/liquidity');
      setLocalDoc(
        'system/liquidity',
        {
          totalFiatInjected: Number(localLiq.data?.totalFiatInjected || 0) + fiatAmount,
          totalUsdInjected: Number(localLiq.data?.totalUsdInjected || 0) + (parseFloat(usdValue) || 0),
          lastSettlementDate: nowIso,
          lastGateway: 'DOKU'
        },
        true
      );

      addLocalCollectionDoc('system/audit/global_transactions', {
        id: `DOKU-${orderId}`,
        category: 'DOKU Checkout Instan',
        gateway: `DOKU (${channelId})`,
        amountIdr: fiatAmount,
        cryptoAmount,
        cryptoCurrency,
        status: 'success',
        timestamp: nowIso,
        userEmail: pendingData?.customerEmail || ''
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
        timestamp: nowIso
      });
    }

    if (invoicePath && INVOICE_PATH_REGEX.test(invoicePath)) {
      setLocalDoc(
        invoicePath,
        {
          status: 'paid',
          paidAt: nowIso,
          paymentMethod: `DOKU Checkout (${channelId})`,
          gatewayOrderId: orderId
        },
        true
      );
    }

    if (db) {
      try {
        const pendingRef = db.collection('doku_pending_transactions').doc(orderId);
        await db.runTransaction(async (transaction) => {
          const snap = await transaction.get(pendingRef);
          if (snap.exists && snap.data()?.status === 'success') {
            return;
          }
          if (userId && cryptoAmount > 0) {
            const userRef = db.collection('users').doc(userId);
            const userSnap = await transaction.get(userRef);
            if (userSnap.exists) {
              const cryptoField = `cryptoBalances.${cryptoCurrency}`;
              transaction.update(userRef, {
                [cryptoField]: FieldValue.increment(cryptoAmount)
              });
            }
          }
          if (invoicePath && INVOICE_PATH_REGEX.test(invoicePath)) {
            transaction.set(
              db.doc(invoicePath),
              {
                status: 'paid',
                paidAt: nowIso,
                paymentMethod: `DOKU Checkout (${channelId})`,
                gatewayOrderId: orderId
              },
              { merge: true }
            );
          }
          transaction.set(
            pendingRef,
            {
              status: 'success',
              settledAt: FieldValue.serverTimestamp(),
              paymentChannel: channelId
            },
            { merge: true }
          );
        });
      } catch (dbErr) {
        console.warn('[DOKU Status] Firestore settlement fallback to local:', dbErr);
      }
    }

    if (userId && cryptoAmount > 0) {
      try {
        await dispatchUserNotification(userId, {
          title: `Pembelian ${cryptoCurrency} Berhasil`,
          message: `Pembayaran DOKU (${channelId}) terverifikasi. +${cryptoAmount} ${cryptoCurrency} dikreditkan ke dompet Anda.`,
          type: 'success',
          actionUrl: '/crypto/buy',
          cryptoAmount,
          cryptoCurrency,
          amount: fiatAmount
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      orderId,
      transactionStatus: 'SUCCESS',
      settled: true,
      alreadySettled: false,
      cryptoAmount,
      cryptoCurrency,
      amount: fiatAmount,
      invoiceId,
      invoicePath,
      channelId
    });
  } catch (error: any) {
    console.error('[DOKU Status Error]', error);
    return NextResponse.json({ error: error.message || 'Gagal memverifikasi status DOKU.' }, { status: 500 });
  }
}

