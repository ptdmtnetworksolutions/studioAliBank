import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * @fileOverview API Webhook PayPal AliBank V3.
 * Menangani notifikasi riil dari PayPal (Server-to-Server) menggunakan Admin SDK.
 * Mencegah duplikasi data likuiditas (double-counting) dan kegagalan otentikasi.
 */

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

// Helper to authenticate with PayPal
async function getPayPalAccessToken(clientId: string, clientSecret: string) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  try {
    const res = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });
    if (res.ok) {
      const data = await res.json();
      return { token: data.access_token, baseUrl: 'https://api-m.paypal.com' };
    }
  } catch (e) {
    console.warn("PayPal Live authentication failed, attempting Sandbox fallback...");
  }

  const res = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });

  if (!res.ok) {
    throw new Error('Gagal otentikasi PayPal API.');
  }
  const data = await res.json();
  return { token: data.access_token, baseUrl: 'https://api-m.sandbox.paypal.com' };
}

// Helper to verify payment capture via back-channel GET request
async function verifyPayPalCapture(transactionId: string, clientId: string, clientSecret: string): Promise<boolean> {
  try {
    const { token, baseUrl } = await getPayPalAccessToken(clientId, clientSecret);
    const res = await fetch(`${baseUrl}/v2/payments/captures/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn(`[PayPal Audit] Gagal menanyakan status capture ${transactionId} ke PayPal REST API.`);
      return false;
    }

    const data = await res.json();
    return data.status === 'COMPLETED';
  } catch (err: any) {
    console.error('[PayPal Audit Error] Gagal melakukan audit back-channel:', err.message);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body.event_type;

    // Inisialisasi Firebase Admin
    const app = getAdminApp();
    const db = getFirestore(app);

    console.log(`[PayPal Webhook] Menerima Event: ${eventType}`);

    // 1. Fokus hanya pada penangkapan dana yang berhasil (PAYMENT.CAPTURE.COMPLETED)
    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = body.resource;
      const amountUsd = parseFloat(resource.amount.value);
      const transactionId = resource.id; // Capture ID
      const orderId = resource.supplementary_data?.related_ids?.order_id; // Order ID jika ada

      // 1b. Dapatkan kredensial PayPal dari Firestore untuk verifikasi back-channel
      const apiKeysSnap = await db.collection('system').doc('api_keys').get();
      const keys = apiKeysSnap.exists ? apiKeysSnap.data()! : {};
      const { paypalClientId, paypalClientSecret } = keys;

      if (paypalClientId && paypalClientSecret) {
        const isLegit = await verifyPayPalCapture(transactionId, paypalClientId, paypalClientSecret);
        if (!isLegit) {
          console.warn(`[PayPal Webhook Warning] Transaksi ${transactionId} gagal diverifikasi lewat back-channel! Potensi fraud/spoofing.`);
          return NextResponse.json({ error: 'Verifikasi transaksi gagal.' }, { status: 400 });
        }
      }

      // LOGIKA ANTI-DUPLIKASI (Idempotency):
      // Pembayaran POS NFC (NFC Tap) dan checkout client-side (finalizeTransaction) sudah merekam 
      // transaksi ini langsung ke database agar respons instan.
      // Kita perlu mengecek ID transaksi/order ini agar tidak terjadi double-counting saldo / likuiditas.
      const possibleIds = [
        `POS-NFC-${transactionId}`,
        `BUY-${transactionId}`,
        `WEBHOOK-PAYPAL-${transactionId}`
      ];
      if (orderId) {
        possibleIds.push(`POS-NFC-${orderId}`);
        possibleIds.push(`BUY-${orderId}`);
        possibleIds.push(`WEBHOOK-PAYPAL-${orderId}`);
      }

      const dupQuery = await db.collection('system')
        .doc('audit')
        .collection('global_transactions')
        .where('id', 'in', possibleIds)
        .get();

      if (!dupQuery.empty) {
        console.log(`[PayPal Webhook] Transaksi ${transactionId} (Order: ${orderId}) sudah diproses sebelumnya di ledger. Mengabaikan.`);
        return NextResponse.json({ message: 'Webhook Processed (Duplicate Ignored)' }, { status: 200 });
      }

      const liquidityRef = db.collection('system').doc('liquidity');
      const auditRef = db.collection('system').doc('audit').collection('global_transactions').doc();

      // Update Likuiditas Global (IDR Estimasi)
      const estimatedIdr = amountUsd * 17690; 
      
      await liquidityRef.update({
        totalUsdInjected: FieldValue.increment(amountUsd),
        totalFiatInjected: FieldValue.increment(estimatedIdr)
      });

      // Catat ke Buku Besar Audit sebagai penyelesaian otomatis
      await auditRef.set({
        id: `WEBHOOK-PAYPAL-${transactionId}`,
        category: "External Settlement",
        gateway: "PayPal Webhook Auto",
        amountUsd: amountUsd,
        amountIdr: estimatedIdr,
        description: `Otomatisasi kliring via Webhook untuk Transaksi ${transactionId} (Order: ${orderId || 'N/A'}).`,
        status: "success",
        timestamp: FieldValue.serverTimestamp(),
        userEmail: "system_reconciliation@alibank.com"
      });

      console.log(`[PayPal Webhook] Sukses memproses kliring untuk transaksi: ${transactionId}`);
      return NextResponse.json({ message: 'Webhook Processed' }, { status: 200 });
    }

    // 2. Menangani Refund (PAYMENT.CAPTURE.REFUNDED)
    if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
      console.warn(`[PayPal Webhook] Terdeteksi Refund: ${body.resource.id}`);
      // Di sini bisa ditambahkan logika pengurangan likuiditas jika diperlukan
    }

    return NextResponse.json({ message: 'Event Ignored' }, { status: 200 });
  } catch (error: any) {
    console.error('[PayPal Webhook Error]:', error.message);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
