
'use server';

/**
 * @fileOverview Server Actions untuk integrasi Midtrans yang aman.
 * Menangani pembuatan Snap Token tanpa mengekspos Server Key ke klien.
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

async function getMidtransServerKey(): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID || 'darmedia-pos';
  
  // 1. Try GCP Secret Manager
  try {
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/MIDTRANS_SERVER_KEY/versions/latest`,
    });
    const payload = version.payload?.data?.toString();
    if (payload) return payload;
  } catch (error: any) {
    console.warn('Secret Manager for Midtrans key failed, trying env/Firestore fallback...');
  }

  // 2. Try Env variables
  if (process.env.MIDTRANS_SERVER_KEY) {
    return process.env.MIDTRANS_SERVER_KEY;
  }

  // 3. Fallback: Firestore
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const snap = await getDoc(doc(db, "system", "api_keys"));
    if (snap.exists()) {
      return snap.data().midtransServerKey || "";
    }
  } catch (e) {
    console.error('Firestore fallback for Midtrans server key failed:', e);
  }
  
  return "";
}

export async function createMidtransSnapTokenAction(
  orderId: string,
  amount: number,
  customerName: string,
  customerEmail: string,
  serverKey?: string
) {
  const actualServerKey = serverKey || await getMidtransServerKey();
  if (!actualServerKey) {
    throw new Error('Midtrans Server Key belum dikonfigurasi.');
  }

  // Basic Auth header menggunakan Server Key (Tanpa password)
  const authHeader = Buffer.from(`${actualServerKey}:`).toString('base64');

  try {
    // Gunakan URL Production atau Sandbox berdasarkan prefix key
    const isProduction = !actualServerKey.startsWith('SB-');
    const baseUrl = isProduction 
      ? 'https://app.midtrans.com/snap/v1/transactions' 
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

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
      throw new Error(data.error_messages?.[0] || 'Gagal membuat token pembayaran Midtrans.');
    }

    return {
      token: data.token,
      redirect_url: data.redirect_url
    };
  } catch (err: any) {
    console.error('Midtrans Action Error:', err);
    throw new Error(err.message || 'Hambatan node kliring Midtrans terdeteksi.');
  }
}
