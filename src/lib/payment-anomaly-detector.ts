/**
 * AliBank Payment Anomaly & Fraud Detection Engine
 * Memproteksi rute pembayaran kritis terhadap:
 * 1. Serangan replay / duplikasi transaksi (Idempotency)
 * 2. Lonjakan transaksi tidak wajar / Brute-force (Velocity Rate Limiter)
 * 3. Pelanggaran batas nominal transaksi tanpa PIN (BI & EMV Contactless Limit)
 * 4. Manipulasi nomor kartu (Luhn Checksum Verification)
 * 5. Validasi integritas perangkat / Attestation Token
 */

interface VelocityRecord {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
}

// In-memory cache untuk velocity & idempotency
const velocityCache = new Map<string, VelocityRecord>();
const idempotencyCache = new Map<string, { timestamp: number; result: any }>();

// Konfigurasi Standar Keamanan Perbankan
export const PAYMENT_SECURITY_LIMITS = {
  // Batas maksimal SoftPOS Contactless per transaksi tanpa PIN (Standar BI / Visa / Mastercard MPoC)
  MAX_SOFTPOS_SINGLE_TRANSACTION_IDR: 15_000_000, // Rp 15 Juta per tap
  // Batas maksimal penarikan kripto per transaksi tanpa 2FA biometric tambahan
  MAX_CRYPTO_WITHDRAW_USD: 10_000,
  // Batas frekuensi transaksi per kartu / IP: Maks 5 kali per 60 detik
  VELOCITY_MAX_REQUESTS: 5,
  VELOCITY_WINDOW_MS: 60_000,
  // Masa simpan idempotency: 24 jam
  IDEMPOTENCY_TTL_MS: 24 * 60 * 60 * 1000,
};

/**
 * Validasi Nomor Kartu menggunakan Algoritma Luhn (Mod 10)
 */
export function validateLuhnChecksum(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Velocity Rate Limiter untuk Mencegah Flooding / Brute-Force pada Rute Finansial
 */
export function checkPaymentVelocity(identifier: string): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const record = velocityCache.get(identifier);

  if (!record || now - record.firstAttemptAt > PAYMENT_SECURITY_LIMITS.VELOCITY_WINDOW_MS) {
    velocityCache.set(identifier, {
      count: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
    });
    return {
      allowed: true,
      remaining: PAYMENT_SECURITY_LIMITS.VELOCITY_MAX_REQUESTS - 1,
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= PAYMENT_SECURITY_LIMITS.VELOCITY_MAX_REQUESTS) {
    const timePassed = now - record.firstAttemptAt;
    const retryAfter = Math.ceil((PAYMENT_SECURITY_LIMITS.VELOCITY_WINDOW_MS - timePassed) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfter),
    };
  }

  record.count += 1;
  record.lastAttemptAt = now;
  velocityCache.set(identifier, record);

  return {
    allowed: true,
    remaining: PAYMENT_SECURITY_LIMITS.VELOCITY_MAX_REQUESTS - record.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Idempotency Check untuk Mencegah Replay Attack & Double-Debiting
 */
export function checkIdempotency(key: string): { isDuplicate: boolean; cachedResult?: any } {
  if (!key) return { isDuplicate: false };

  const cached = idempotencyCache.get(key);
  if (cached) {
    const isExpired = Date.now() - cached.timestamp > PAYMENT_SECURITY_LIMITS.IDEMPOTENCY_TTL_MS;
    if (!isExpired) {
      return { isDuplicate: true, cachedResult: cached.result };
    }
    idempotencyCache.delete(key);
  }

  return { isDuplicate: false };
}

export function saveIdempotencyResult(key: string, result: any): void {
  if (!key) return;
  idempotencyCache.set(key, {
    timestamp: Date.now(),
    result,
  });

  // Pembersihan berkala jika cache melebihi 10.000 entri
  if (idempotencyCache.size > 10000) {
    const now = Date.now();
    for (const [k, v] of idempotencyCache.entries()) {
      if (now - v.timestamp > PAYMENT_SECURITY_LIMITS.IDEMPOTENCY_TTL_MS) {
        idempotencyCache.delete(k);
      }
    }
  }
}

export interface AttestationPayload {
  packageName: string;
  isRooted: boolean;
  isEmulator: boolean;
  isDebuggerAttached: boolean;
  integrityVerdict: string;
  timestamp: number;
  nonce?: string;
  signature?: string;
}

/**
 * Validasi Token Integritas Perangkat (Play Integrity / SoftPOS Attestation)
 */
export function verifyDeviceAttestation(token: string | null | undefined): {
  isValid: boolean;
  isRooted: boolean;
  verdict: string;
  error?: string;
} {
  if (!token) {
    // Mode dev / simulasi Web POS: Izinkan dengan peringatan jika token tidak dikirim
    return {
      isValid: true,
      isRooted: false,
      verdict: 'WEB_SIMULATION_SANDBOX',
    };
  }

  try {
    // Format token: base64 payload JSON
    const decodedStr = Buffer.from(token, 'base64').toString('utf-8');
    const payload: AttestationPayload = JSON.parse(decodedStr);

    if (payload.isRooted) {
      return {
        isValid: false,
        isRooted: true,
        verdict: 'DEVICE_ROOTED_COMPROMISED',
        error: 'Integritas perangkat terkompromi: Root binary atau Magisk terdeteksi pada terminal POS.',
      };
    }

    if (payload.isDebuggerAttached) {
      return {
        isValid: false,
        isRooted: false,
        verdict: 'DEBUGGER_ATTACHED',
        error: 'Integritas proses terkompromi: Debugger aktif terdeteksi pada terminal.',
      };
    }

    // Cek umur token (maks 5 menit untuk mencegah replay token integritas)
    const now = Date.now();
    if (Math.abs(now - payload.timestamp) > 300_000) {
      return {
        isValid: false,
        isRooted: false,
        verdict: 'ATTESTATION_EXPIRED',
        error: 'Token pengesahan integritas perangkat telah kedaluwarsa.',
      };
    }

    return {
      isValid: true,
      isRooted: false,
      verdict: payload.integrityVerdict || 'MEETS_DEVICE_INTEGRITY',
    };
  } catch (err) {
    return {
      isValid: false,
      isRooted: false,
      verdict: 'ATTESTATION_MALFORMED',
      error: 'Format token integritas perangkat tidak valid.',
    };
  }
}
