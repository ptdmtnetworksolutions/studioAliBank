import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';
import { DEFAULT_SOFTPOS_PROFILE } from '@/lib/softpos-acquirer';
import { detectCardBin } from '@/lib/bin-detector';
import { getLocalDoc, setLocalDoc } from '@/lib/local-firestore-store';
import { createDokuCheckout, DOKU_CONFIG_DEFAULT, DokuConfig } from '@/lib/doku';
import {
  checkPaymentVelocity,
  checkIdempotency,
  saveIdempotencyResult,
  validateLuhnChecksum,
  verifyDeviceAttestation,
  PAYMENT_SECURITY_LIMITS,
} from '@/lib/payment-anomaly-detector';
import {
  extractRequestTokens,
  verifyFirebaseToken,
  isAdminIdentity,
  attachAuthCookies,
  validateCryptoAmountAgainstIdr,
} from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

function getAdminApp(): App | null {
  try {
    if (getApps().length > 0) return getApps()[0];
    return initializeApp({ projectId: firebaseConfig.projectId });
  } catch (e) {
    return null;
  }
}

async function restCreateDoc(colPath: string, payload: Record<string, any>): Promise<boolean> {
  try {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (typeof v === 'number') {
        fields[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
      } else if (typeof v === 'string') {
        fields[k] = { stringValue: v };
      } else if (typeof v === 'boolean') {
        fields[k] = { booleanValue: v };
      }
    }
    const res = await fetch(`${FIRESTORE_BASE}/${colPath}?key=${firebaseConfig.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
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
    console.warn('[SoftPOS DOKU Config] Firestore Admin fallback to default:', err);
  }

  return config;
}

/**
 * POST /api/payments/softpos
 * Memproses transaksi kartu debit/kredit & SoftPOS via DOKU Payment Gateway resmi PT DMT Network Solutions.
 * Sesi pembayaran resmi dibuat di DOKU dan pemotongan dana riil dilakukan melalui DOKU Checkout / 3D-Secure.
 * Koin kripto HANYA dikreditkan setelah DOKU memverifikasi status pembayaran SUCCESS.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verifikasi autentikasi & kepemilikan akun
    const { idToken: rawIdToken, refreshToken: rawRefreshToken } = extractRequestTokens(request, body);
    if (!rawIdToken && !rawRefreshToken) {
      return NextResponse.json({ error: 'Akses ditolak. Token otentikasi diperlukan.' }, { status: 401 });
    }
    const caller = await verifyFirebaseToken(rawIdToken, rawRefreshToken);
    if (!caller) {
      return NextResponse.json({ error: 'Sesi kedaluwarsa atau tidak valid. Silakan login kembali.' }, { status: 401 });
    }

    const {
      userId,
      userEmail,
      cardNumber,
      cardExpiry,
      cardHolderName,
      cardCvv,
      amountIdr,
      cryptoAmount,
      cryptoCurrency,
      usdValue,
      idempotencyKey,
      attestationToken,
    } = body;

    if (!userId || (caller.uid !== userId && !isAdminIdentity(caller))) {
      return NextResponse.json(
        { error: 'Akses terlarang. Anda hanya dapat memproses pembayaran akun Anda sendiri.' },
        { status: 403 }
      );
    }

    // =========================================================================
    // 1. DEVICE INTEGRITY & HARDWARE ATTESTATION
    // =========================================================================
    const headerAttestation = request.headers.get('x-device-attestation');
    const attestation = verifyDeviceAttestation(headerAttestation || attestationToken);
    if (!attestation.isValid) {
      return NextResponse.json(
        { error: 'Integritas perangkat tidak valid untuk transaksi perbankan. Silakan perbarui aplikasi.' },
        { status: 403 }
      );
    }

    // =========================================================================
    // 2. ANOMALY DETECTION: PARAMETER & LUHN CHECKSUM
    // =========================================================================
    if (!userId || !cardNumber || !amountIdr || !cryptoAmount || !cryptoCurrency) {
      return NextResponse.json(
        { error: 'Parameter transaksi SoftPOS tidak lengkap. Pastikan nomor kartu dan nominal terisi.' },
        { status: 400 }
      );
    }

    const cleanCard = String(cardNumber).replace(/\s+/g, '');
    const isLuhnValid = validateLuhnChecksum(cleanCard);
    if (!isLuhnValid) {
      return NextResponse.json(
        { error: 'Nomor kartu debit/kredit tidak lolos verifikasi checksum standar perbankan (Luhn Mod-10).' },
        { status: 400 }
      );
    }

    // =========================================================================
    // 3. ANOMALY DETECTION: BATAS TRANSAKSI & FREKUENSI (VELOCITY)
    // =========================================================================
    const parsedAmountIdr = Number(amountIdr);
    if (parsedAmountIdr <= 0 || isNaN(parsedAmountIdr)) {
      return NextResponse.json({ error: 'Nominal transaksi harus lebih dari Rp 0.' }, { status: 400 });
    }

    if (parsedAmountIdr > PAYMENT_SECURITY_LIMITS.MAX_SOFTPOS_SINGLE_TRANSACTION_IDR) {
      return NextResponse.json(
        {
          error: `Nominal transaksi melebihi batas regulasi Bank Indonesia untuk transaksi SoftPOS Contactless tanpa PIN (Maksimal Rp ${PAYMENT_SECURITY_LIMITS.MAX_SOFTPOS_SINGLE_TRANSACTION_IDR.toLocaleString('id-ID')}).`,
        },
        { status: 400 }
      );
    }

    if (!validateCryptoAmountAgainstIdr(cryptoCurrency, Number(cryptoAmount), parsedAmountIdr)) {
      return NextResponse.json(
        { error: 'Nominal konversi aset kripto tidak sesuai dengan nilai pembayaran IDR.' },
        { status: 400 }
      );
    }

    // Velocity Limiter berdasarkan User ID dan BIN kartu
    const velocityKey = `softpos_${userId}_${cleanCard.slice(0, 6)}`;
    const velocity = checkPaymentVelocity(velocityKey);
    if (!velocity.allowed) {
      return NextResponse.json(
        {
          error: `Frekuensi transaksi terdeteksi anomali. Harap tunggu ${velocity.retryAfterSeconds} detik sebelum melakukan pembayaran kembali.`,
        },
        { status: 429 }
      );
    }

    // =========================================================================
    // 4. IDEMPOTENCY & REPLAY ATTACK PROTECTION
    // =========================================================================
    const safeIdempotencyKey = idempotencyKey || `${userId}_${cleanCard.slice(-4)}_${parsedAmountIdr}_${Math.floor(Date.now() / 30000)}`;
    const idempCheck = checkIdempotency(safeIdempotencyKey);
    if (idempCheck.isDuplicate && idempCheck.cachedResult) {
      const dupRes = NextResponse.json(idempCheck.cachedResult);
      attachAuthCookies(dupRes, caller.newIdToken, caller.newRefreshToken);
      return dupRes;
    }

    const cardBin = detectCardBin(cleanCard);

    // =========================================================================
    // 5. REGISTRASI TRANSAKSI RESMI KE DOKU PAYMENT GATEWAY (REAL SETTLEMENT)
    // =========================================================================
    const dokuConfig = await resolveDokuConfig();
    const orderId = `DOKU-CARD-${Date.now()}`;
    const nowIso = new Date().toISOString();

    // Catat status pending di Local Store dan Firestore
    const pendingPayload = {
      orderId,
      userId,
      userEmail: userEmail || caller.email || '',
      customerName: cardHolderName || cardBin.bank.shortName || 'Nasabah AliBank',
      amount: parsedAmountIdr,
      cryptoAmount: parseFloat(String(cryptoAmount)),
      cryptoCurrency,
      usdValue: usdValue || '0',
      status: 'pending',
      paymentMethod: 'CREDIT_CARD',
      paymentChannel: 'CREDIT_CARD',
      bankName: cardBin.bank.name,
      cardType: cardBin.cardType,
      network: cardBin.network,
      maskedPan: cardBin.maskedPan,
      cardHolder: cardHolderName || '',
      source: 'SOFTPOS_EDC',
      terminalId: DEFAULT_SOFTPOS_PROFILE.terminalId,
      merchantName: DEFAULT_SOFTPOS_PROFILE.merchantName,
      createdAt: nowIso,
    };

    setLocalDoc(`doku_pending_transactions/${orderId}`, pendingPayload, true);

    try {
      const adminApp = getAdminApp();
      if (adminApp) {
        const db = getFirestore(adminApp);
        await db.collection('doku_pending_transactions').doc(orderId).set({
          ...pendingPayload,
          createdAt: FieldValue.serverTimestamp(),
        });
      } else {
        await restCreateDoc(`doku_pending_transactions`, {
          orderId,
          userId,
          amount: parsedAmountIdr,
          status: 'pending',
          createdAt: nowIso,
        });
      }
    } catch (saveErr) {
      console.warn('[SoftPOS DOKU] Warning saving pending transaction:', saveErr);
    }

    // Panggil API resmi DOKU untuk pembuatan sesi checkout / otorisasi kartu
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alibank.tarroz.com';
    const callbackUrl = `${appUrl}/crypto/buy?status=success&orderId=${encodeURIComponent(orderId)}`;

    const checkoutResult = await createDokuCheckout(
      {
        orderId,
        amount: parsedAmountIdr,
        customerName: cardHolderName || cardBin.bank.shortName || 'Nasabah AliBank',
        customerEmail: userEmail || caller.email || 'nasabah@alibank.id',
        callbackUrl,
        paymentMethodTypes: ['CREDIT_CARD'],
      },
      dokuConfig
    );

    if (!checkoutResult.success || !checkoutResult.paymentUrl) {
      console.error('[SoftPOS DOKU Checkout Failed]', checkoutResult.error);
      return NextResponse.json(
        {
          error: checkoutResult.error || 'Gagal membuat sesi pembayaran kartu DOKU.',
          orderId,
        },
        { status: 502 }
      );
    }

    const responsePayload = {
      success: true,
      orderId,
      paymentUrl: checkoutResult.paymentUrl,
      requiresPayment: true,
      cardBin,
      amountIdr: parsedAmountIdr,
      cryptoAmount: parseFloat(String(cryptoAmount)),
      cryptoCurrency,
      securityVerdict: attestation.verdict,
      message: 'Sesi otorisasi pembayaran DOKU resmi berhasil dibuat. Silakan selesaikan pembayaran.',
    };

    saveIdempotencyResult(safeIdempotencyKey, responsePayload);

    const res = NextResponse.json(responsePayload);
    attachAuthCookies(res, caller.newIdToken, caller.newRefreshToken);
    return res;
  } catch (err: any) {
    console.error('[SoftPOS Error]:', err.message);
    return NextResponse.json(
      { error: err.message || 'Gagal memproses transaksi SoftPOS DOKU.' },
      { status: 500 }
    );
  }
}
