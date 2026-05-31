
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

async function getMidtransServerKey(): Promise<string> {
  // Priority 1: Environment variable
  if (process.env.MIDTRANS_SERVER_KEY) {
    return process.env.MIDTRANS_SERVER_KEY;
  }

  // Priority 2: Firebase Admin SDK (auto on GCP, needs GOOGLE_APPLICATION_CREDENTIALS locally)
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    const snap = await adminDb.doc('system/api_keys').get();
    if (snap.exists) {
      const key = snap.data()?.midtransServerKey;
      if (key) return key;
    }
  } catch (e: any) {
    console.warn('[Midtrans Route] Admin SDK unavailable:', e?.code || e?.message?.slice(0, 80));
  }

  return '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, customerName, customerEmail } = body;

    if (!orderId || !amount || !customerName) {
      return NextResponse.json({ error: 'Parameter tidak lengkap.' }, { status: 400 });
    }

    const serverKey = await getMidtransServerKey();
    if (!serverKey) {
      return NextResponse.json(
        { error: 'Midtrans Server Key belum dikonfigurasi. Isi di Admin → API Management.' },
        { status: 503 }
      );
    }

    const isProduction = !serverKey.startsWith('SB-');
    const baseUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

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
