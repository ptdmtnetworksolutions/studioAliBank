import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';
import { createDokuCheckout, DOKU_CONFIG_DEFAULT } from '@/lib/doku';

export const dynamic = 'force-dynamic';

function getAdminApp(): App | null {
  try {
    if (getApps().length > 0) return getApps()[0];
    return initializeApp({ projectId: firebaseConfig.projectId });
  } catch (e) {
    return null;
  }
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
      usdValue
    } = body;

    if (!orderId || !amount || !customerName) {
      return NextResponse.json({ error: 'Parameter transaksi tidak lengkap.' }, { status: 400 });
    }

    // Ambil konfigurasi (Bisa override dari Firestore system/api_keys jika diset)
    let config = { ...DOKU_CONFIG_DEFAULT };
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
          if (kData?.dokuIsProduction !== undefined) config.isProduction = kData.dokuIsProduction;
        }

        // Catat pending transaksi di Firestore
        await db.collection('doku_pending_transactions').doc(orderId).set({
          orderId,
          amount: Number(amount),
          customerName,
          customerEmail: customerEmail || '',
          userId: userId || '',
          cryptoAmount: Number(cryptoAmount || 0),
          cryptoCurrency: cryptoCurrency || 'ALX',
          usdValue: String(usdValue || '0'),
          status: 'pending',
          createdAt: new Date().toISOString(),
          gateway: 'DOKU Checkout'
        });
      }
    } catch (dbErr) {
      console.warn('[DOKU Checkout] Warning recording pending doc:', dbErr);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alibank.tarroz.com';
    const checkoutResult = await createDokuCheckout(
      {
        orderId,
        amount: Number(amount),
        customerName,
        customerEmail: customerEmail || 'nasabah@alibank.id',
        callbackUrl: `${appUrl}/crypto/buy?status=success&orderId=${orderId}`
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
