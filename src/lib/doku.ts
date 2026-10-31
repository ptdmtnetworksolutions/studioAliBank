/**
 * DOKU Payment Gateway Client & Cryptographic Signature Engine
 * Berlisensi Bank Indonesia (Kategori 1 - Payment Gateway, Acquirer & Switching)
 * Mitra Resmi: PT DMT Network Solutions
 * 
 * Mendukung:
 * - Virtual Account Seluruh Bank (BSI, BCA, Mandiri, BRI, BNI, Danamon, CIMB, Permata)
 * - QRIS Dinamis Bank Indonesia
 * - SNAP BI Direct Debit (BCA OneKlik, Mandiri Direct Debit, BRI Direct Debit)
 * - Kartu Kredit & Debit Internasional (Visa, Mastercard, JCB)
 */

import crypto from 'crypto';

export interface DokuConfig {
  clientId: string;
  secretKey: string;
  apiKey: string;
  isProduction: boolean;
}

export const DOKU_CONFIG_DEFAULT: DokuConfig = {
  clientId: process.env.DOKU_CLIENT_ID || 'BRN-0209-1775738330323',
  secretKey: process.env.DOKU_SECRET_KEY || 'SK-TT8V3jWaiU8DhL0wC4Sy',
  apiKey: process.env.DOKU_API_KEY || 'doku_key_e64fc572ccdd4bcf8fe787d331172b95',
  isProduction: process.env.DOKU_IS_PRODUCTION !== 'false'
};

export interface DokuCheckoutRequest {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  callbackUrl?: string;
  autoRedirect?: boolean;
}

export interface DokuCheckoutResponse {
  payment: {
    url: string;
    token_id?: string;
  };
  order: {
    invoice_number: string;
    amount: number;
  };
}

/**
 * Generate DOKU HMAC-SHA256 Signature Sesuai Spesifikasi Resmi DOKU v1
 * Digest = Base64(SHA256(rawBody))
 * Component = "Client-Id:{clientId}\nRequest-Id:{requestId}\nRequest-Timestamp:{requestTimestamp}\nRequest-Target:{requestTarget}\nDigest:{digest}"
 * Signature = "HMACSHA256=" + Base64(HMAC-SHA256(secretKey, Component))
 */
export function generateDokuSignature({
  clientId,
  requestId,
  requestTimestamp,
  requestTarget,
  rawBody,
  secretKey
}: {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  rawBody: string;
  secretKey: string;
}): { signature: string; digest: string } {
  // 1. Calculate Digest
  const digest = crypto.createHash('sha256').update(rawBody).digest('base64');

  // 2. Build component string-to-sign
  const component = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;

  // 3. Compute HMAC-SHA256
  const hmac = crypto.createHmac('sha256', secretKey).update(component).digest('base64');
  const signature = `HMACSHA256=${hmac}`;

  return { signature, digest };
}

/**
 * Verifikasi signature webhook yang dikirimkan oleh server DOKU
 */
export function verifyDokuWebhookSignature({
  clientId,
  requestId,
  requestTimestamp,
  requestTarget,
  rawBody,
  incomingSignature,
  secretKey
}: {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  rawBody: string;
  incomingSignature: string;
  secretKey: string;
}): boolean {
  try {
    const { signature } = generateDokuSignature({
      clientId,
      requestId,
      requestTimestamp,
      requestTarget,
      rawBody,
      secretKey
    });

    const cleanIncoming = incomingSignature.trim();
    const cleanGenerated = signature.trim();

    return crypto.timingSafeEqual(
      Buffer.from(cleanIncoming),
      Buffer.from(cleanGenerated)
    );
  } catch (err) {
    console.error('[DOKU] Signature verification error:', err);
    return false;
  }
}

/**
 * Membuat transaksi DOKU Checkout Payment Link
 */
export async function createDokuCheckout(
  req: DokuCheckoutRequest,
  config: DokuConfig = DOKU_CONFIG_DEFAULT
): Promise<{ success: boolean; paymentUrl?: string; error?: string; rawData?: any }> {
  try {
    const baseUrl = config.isProduction
      ? 'https://api.doku.com'
      : 'https://api-sandbox.doku.com';

    const endpoint = '/checkout/v1/payment';
    const requestTarget = endpoint;
    const requestId = `REQ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const requestTimestamp = new Date().toISOString().slice(0, 19) + 'Z';

    const payload = {
      order: {
        amount: Math.round(req.amount),
        invoice_number: req.orderId,
        currency: 'IDR',
        callback_url: req.callbackUrl || 'https://alibank.tarroz.com/crypto/buy?status=success',
        auto_redirect: req.autoRedirect ?? true
      },
      payment: {
        payment_due_date: 60 // 60 menit
      },
      customer: {
        id: `CUST-${req.orderId.slice(-6)}`,
        name: req.customerName,
        email: req.customerEmail || 'customer@alibank.id',
        phone: req.customerPhone || '08123456789'
      }
    };

    const rawBody = JSON.stringify(payload);
    const { signature, digest } = generateDokuSignature({
      clientId: config.clientId,
      requestId,
      requestTimestamp,
      requestTarget,
      rawBody,
      secretKey: config.secretKey
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Client-Id': config.clientId,
      'Request-Id': requestId,
      'Request-Timestamp': requestTimestamp,
      'Signature': signature,
      'Digest': digest
    };

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: rawBody,
      cache: 'no-store'
    });

    const resJson = await response.json();

    if (!response.ok) {
      console.error('[DOKU Checkout Error]', resJson);
      return {
        success: false,
        error: resJson.error?.message || resJson.message || `DOKU HTTP Error ${response.status}`,
        rawData: resJson
      };
    }

    const paymentUrl = resJson.response?.payment?.url || resJson.payment?.url;
    if (!paymentUrl) {
      return {
        success: false,
        error: 'URL pembayaran DOKU tidak ditemukan dalam respon.',
        rawData: resJson
      };
    }

    return {
      success: true,
      paymentUrl,
      rawData: resJson
    };
  } catch (error: any) {
    console.error('[DOKU Checkout Exception]', error);
    return {
      success: false,
      error: error.message || 'Gagal menghubungi server DOKU.'
    };
  }
}
