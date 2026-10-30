
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

/**
 * @fileOverview API Route untuk membuat Midtrans Snap Token secara aman.
 * Menggunakan Firebase Admin SDK untuk membaca Server Key tanpa expose ke client.
 * 
 * POST /api/payments/midtrans-token
 * Body: { orderId, amount, customerName, customerEmail }
 */

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  // In Firebase App Hosting, credentials are auto-provided via ADC
  return initializeApp({ projectId: 'darmedia-pos' });
}

async function getMidtransConfig(): Promise<{ serverKey: string; isSandbox: boolean }> {
  // Priority 1: Environment variable
  if (process.env.MIDTRANS_SERVER_KEY) {
    const isSandbox = process.env.MIDTRANS_IS_PRODUCTION !== 'true' || process.env.MIDTRANS_IS_SANDBOX === 'true';
    return { serverKey: process.env.MIDTRANS_SERVER_KEY, isSandbox };
  }

  // Priority 2: Firebase Admin SDK (Firestore system/api_keys)
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    const snap = await adminDb.doc('system/api_keys').get();
    if (snap.exists) {
      const data = snap.data();
      const key = data?.midtransServerKey;
      if (key) {
        const isSandbox = data?.midtransSandbox !== false;
        return { serverKey: key, isSandbox };
      }
    }
  } catch (e: any) {
    console.warn('[Midtrans Route] Admin SDK unavailable:', e?.code || e?.message?.slice(0, 80));
  }

  return { 
    serverKey: process.env.MIDTRANS_SERVER_KEY || '', 
    isSandbox: true 
  };
}

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
      return NextResponse.json({ error: 'Parameter tidak lengkap.' }, { status: 400 });
    }

    const { serverKey, isSandbox } = await getMidtransConfig();
    if (!serverKey) {
      return NextResponse.json(
        { error: 'Midtrans Server Key belum dikonfigurasi. Isi di Admin → API Management.' },
        { status: 503 }
      );
    }

    const baseUrl = isSandbox
      ? 'https://app.sandbox.midtrans.com/snap/v1/transactions'
      : 'https://app.midtrans.com/snap/v1/transactions';

    const authHeader = Buffer.from(`${serverKey}:`).toString('base64');

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authHeader}`
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: amount },
        customer_details: { first_name: customerName, email: customerEmail || '' },
        credit_card: { secure: true },
        expiry: { duration: 1, unit: 'days' }
      }),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error_messages?.[0] || data.message || `Midtrans error (${response.status})`;
      console.error('[Midtrans Route] API error:', errMsg);
      return NextResponse.json({ error: errMsg }, { status: response.status });
    }

    if (userId) {
      try {
        const adminApp = getAdminApp();
        const adminDb = getFirestore(adminApp);
        await adminDb.collection('midtrans_pending_transactions').doc(orderId).set({
          orderId,
          amountIdr: amount,
          customerName,
          customerEmail: customerEmail || '',
          userId,
          cryptoAmount: cryptoAmount || 0,
          cryptoCurrency: cryptoCurrency || 'ALX',
          usdValue: usdValue || '0',
          status: 'pending',
          token: data.token,
          createdAt: new Date().toISOString()
        });
      } catch (err: any) {
        console.warn('[Midtrans Route] Failed saving pending doc:', err?.message);
      }
    }

    return NextResponse.json({
      token: data.token,
      redirect_url: data.redirect_url
    });
  } catch (err: any) {
    console.error('[Midtrans Route Error]:', err?.message);
    return NextResponse.json(
      { error: err.message || 'Hambatan gateway Midtrans.' },
      { status: 500 }
    );
  }
}
