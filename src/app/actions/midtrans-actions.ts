
'use server';

/**
 * @fileOverview Server Actions untuk integrasi Midtrans yang aman.
 * Menangani pembuatan Snap Token tanpa mengekspos Server Key ke klien.
 * Menggunakan Firebase Admin SDK untuk membaca kunci dari Firestore secara aman.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  // In Firebase App Hosting / GCP, Application Default Credentials are auto-configured
  // In local dev, set GOOGLE_APPLICATION_CREDENTIALS env var or use projectId only
  try {
    return initializeApp({ projectId: 'darmedia-pos' });
  } catch (e) {
    return getApps()[0];
  }
}

async function getMidtransServerKey(): Promise<string> {
  // 1. Try environment variable (fastest, for production via apphosting.yaml secrets)
  if (process.env.MIDTRANS_SERVER_KEY) {
    return process.env.MIDTRANS_SERVER_KEY;
  }

  // 2. Read from Firestore using Admin SDK (bypasses security rules)
  try {
    const adminApp = getAdminApp();
    const adminDb = getAdminFirestore(adminApp);
    const snap = await adminDb.doc('system/api_keys').get();
    if (snap.exists) {
      const data = snap.data();
      const key = data?.midtransServerKey;
      if (key && typeof key === 'string' && key.length > 0) {
        return key;
      }
    }
  } catch (e: any) {
    console.error('[Midtrans] Admin Firestore read failed:', e?.message || e);
  }

  return '';
}

export async function createMidtransSnapTokenAction(
  orderId: string,
  amount: number,
  customerName: string,
  customerEmail: string
) {
  const actualServerKey = await getMidtransServerKey();
  if (!actualServerKey) {
    throw new Error('Midtrans Server Key belum dikonfigurasi. Pastikan MIDTRANS_SERVER_KEY sudah diisi di Admin > API Management.');
  }

  // Basic Auth header using Server Key (no password)
  const authHeader = Buffer.from(`${actualServerKey}:`).toString('base64');

  // Determine environment: SB- prefix means sandbox
  const isProduction = !actualServerKey.startsWith('SB-');
  const baseUrl = isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authHeader}`
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: amount
        },
        customer_details: {
          first_name: customerName,
          email: customerEmail
        },
        credit_card: {
          secure: true
        },
        expiry: {
          duration: 1,
          unit: 'days'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Midtrans] API error:', JSON.stringify(data));
      throw new Error(data.error_messages?.[0] || `Gagal membuat token Midtrans (${response.status}).`);
    }

    return {
      token: data.token as string,
      redirect_url: data.redirect_url as string
    };
  } catch (err: any) {
    console.error('[Midtrans Action Error]:', err?.message || err);
    throw new Error(err.message || 'Hambatan koneksi gateway Midtrans terdeteksi.');
  }
}
