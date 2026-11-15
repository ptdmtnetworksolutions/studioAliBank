import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';

export const ADMIN_UIDS = new Set([
  'IJOuQpjEOMgvlYfzvQ1yfp976Oa2',
  'IJOuQpjEOMgvlYfzvQ1yfp977Oa2',
]);

export const ADMIN_EMAILS = new Set([
  'alidzulfikar075@gmail.com',
  'aldzulfikar075@gmail.com',
  'dzulfikaraliridlo@gmail.com',
]);

export interface VerifiedCaller {
  uid: string;
  email: string;
  idToken: string;
  newIdToken: string | null;
  newRefreshToken: string | null;
  isAdminClaim?: boolean;
}

export function isAdminIdentity(caller: VerifiedCaller | null | undefined): boolean {
  if (!caller || !caller.uid) return false;
  if (ADMIN_UIDS.has(caller.uid)) return true;
  const cleanEmail = String(caller.email || '').trim().toLowerCase();
  if (cleanEmail && ADMIN_EMAILS.has(cleanEmail)) return true;
  if (caller.isAdminClaim) return true;
  return false;
}

export function extractRequestTokens(
  req: NextRequest,
  body?: Record<string, any> | null
): { idToken: string; refreshToken: string } {
  const authHeader = req.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const bodyIdToken = typeof body?.idToken === 'string' ? body.idToken.trim() : '';
  const cookieToken = (req.cookies.get('alibank_token')?.value || '').trim();
  const idToken = bearerToken || bodyIdToken || cookieToken;

  const bodyRefreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken.trim() : '';
  const cookieRefresh = (req.cookies.get('alibank_refresh')?.value || '').trim();
  const refreshToken = bodyRefreshToken || cookieRefresh;

  return { idToken, refreshToken };
}

function getAdminApp(): App | null {
  try {
    if (getApps().length > 0) return getApps()[0];
    return initializeApp({ projectId: firebaseConfig.projectId });
  } catch {
    return null;
  }
}

function getJwtExpSeconds(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function needsPreemptiveRefresh(token: string): boolean {
  const exp = getJwtExpSeconds(token);
  if (exp === null) return true;
  return Date.now() >= (exp - 60) * 1000;
}

async function refreshFirebaseIdToken(
  refreshToken: string
): Promise<{ idToken: string; refreshToken: string } | null> {
  if (!refreshToken) return null;
  try {
    const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${firebaseConfig.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (data?.id_token) {
      return {
        idToken: String(data.id_token),
        refreshToken: String(data.refresh_token || refreshToken),
      };
    }
    return null;
  } catch {
    return null;
  }
}

let cachedGoogleCerts: { certs: Record<string, string>; expiresAt: number } | null = null;

async function fetchGooglePublicCerts(): Promise<Record<string, string> | null> {
  if (cachedGoogleCerts && Date.now() < cachedGoogleCerts.expiresAt) {
    return cachedGoogleCerts.certs;
  }
  try {
    const res = await fetch(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
      { cache: 'no-store' }
    );
    if (!res.ok) return cachedGoogleCerts?.certs || null;
    const certs = (await res.json().catch(() => null)) as Record<string, string> | null;
    if (!certs || typeof certs !== 'object') return cachedGoogleCerts?.certs || null;

    let ttlMs = 3600 * 1000;
    const cc = res.headers.get('cache-control') || '';
    const maxAgeMatch = cc.match(/max-age=(\d+)/i);
    if (maxAgeMatch) {
      ttlMs = Math.max(60, parseInt(maxAgeMatch[1], 10)) * 1000;
    }
    cachedGoogleCerts = { certs, expiresAt: Date.now() + ttlMs };
    return certs;
  } catch {
    return cachedGoogleCerts?.certs || null;
  }
}

async function verifyJwtWithGoogleCerts(
  token: string
): Promise<{ uid: string; email: string; isAdminClaim: boolean } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

    if (header?.alg !== 'RS256' || typeof header?.kid !== 'string' || !header.kid) {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const expectedIssuer = `https://securetoken.google.com/${firebaseConfig.projectId}`;
    if (payload?.aud !== firebaseConfig.projectId) return null;
    if (payload?.iss !== expectedIssuer) return null;
    if (typeof payload?.sub !== 'string' || payload.sub.length === 0 || payload.sub.length > 128) {
      return null;
    }
    if (typeof payload?.exp !== 'number' || payload.exp <= nowSec) return null;
    if (typeof payload?.iat !== 'number' || payload.iat > nowSec + 300) return null;

    const certs = await fetchGooglePublicCerts();
    const pem = certs?.[header.kid];
    if (!pem) return null;

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${parts[0]}.${parts[1]}`);
    verifier.end();
    const sigBuf = Buffer.from(parts[2], 'base64url');
    if (!verifier.verify(pem, sigBuf)) {
      return null;
    }

    return {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : '',
      isAdminClaim: Boolean(payload.admin === true),
    };
  } catch {
    return null;
  }
}

async function verifySingleIdToken(
  token: string
): Promise<{ ok: boolean; explicitReject?: boolean; uid?: string; email?: string; isAdminClaim?: boolean }> {
  if (!token || token.split('.').length !== 3) {
    return { ok: false, explicitReject: true };
  }

  // 1. Primary: Google Identity Toolkit REST API (accounts:lookup)
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
        cache: 'no-store',
      }
    );
    if (res.ok) {
      const data = await res.json().catch(() => null);
      const u = data?.users?.[0];
      if (u?.localId) {
        let isAdminClaim = false;
        if (typeof u.customAttributes === 'string' && u.customAttributes) {
          try {
            const attrs = JSON.parse(u.customAttributes);
            isAdminClaim = Boolean(attrs?.admin === true);
          } catch {}
        }
        return {
          ok: true,
          uid: String(u.localId),
          email: String(u.email || ''),
          isAdminClaim,
        };
      }
      return { ok: false, explicitReject: true };
    }
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      return { ok: false, explicitReject: true };
    }
  } catch {
    // Network error — fall through to cryptographic verification
  }

  // 2. Fallback: Firebase Admin SDK (if ADC/service account exists)
  try {
    const adminApp = getAdminApp();
    if (adminApp) {
      const decoded = await getAuth(adminApp).verifyIdToken(token);
      if (decoded?.uid) {
        return {
          ok: true,
          uid: decoded.uid,
          email: String(decoded.email || ''),
          isAdminClaim: Boolean((decoded as any).admin === true),
        };
      }
    }
  } catch {
    // Admin SDK unavailable or rejected
  }

  // 3. Fallback: Cryptographic RS256 verification via Google X.509 Public Certificates
  const certVerified = await verifyJwtWithGoogleCerts(token);
  if (certVerified) {
    return {
      ok: true,
      uid: certVerified.uid,
      email: certVerified.email,
      isAdminClaim: certVerified.isAdminClaim,
    };
  }

  return { ok: false };
}

export async function verifyFirebaseToken(
  idToken: string,
  refreshToken?: string
): Promise<VerifiedCaller | null> {
  let currentToken = (idToken || '').trim();
  const cleanRefresh = (refreshToken || '').trim();
  let newIdToken: string | null = null;
  let newRefreshToken: string | null = null;

  if ((!currentToken || needsPreemptiveRefresh(currentToken)) && cleanRefresh) {
    const refreshed = await refreshFirebaseIdToken(cleanRefresh);
    if (refreshed) {
      currentToken = refreshed.idToken;
      newIdToken = refreshed.idToken;
      newRefreshToken = refreshed.refreshToken;
    }
  }

  if (!currentToken) return null;

  let check = await verifySingleIdToken(currentToken);
  if (!check.ok && cleanRefresh && !newIdToken) {
    const refreshed = await refreshFirebaseIdToken(cleanRefresh);
    if (refreshed) {
      currentToken = refreshed.idToken;
      newIdToken = refreshed.idToken;
      newRefreshToken = refreshed.refreshToken;
      check = await verifySingleIdToken(currentToken);
    }
  }

  if (!check.ok || !check.uid) return null;

  return {
    uid: check.uid,
    email: check.email || '',
    idToken: currentToken,
    newIdToken,
    newRefreshToken,
    isAdminClaim: check.isAdminClaim,
  };
}

export function attachAuthCookies(
  res: NextResponse,
  newIdToken: string | null,
  newRefreshToken: string | null
): void {
  const isProd = process.env.NODE_ENV === 'production';
  if (newIdToken) {
    res.cookies.set({
      name: 'alibank_token',
      value: newIdToken,
      path: '/',
      maxAge: 2592000,
      sameSite: 'lax',
      secure: isProd,
    });
  }
  if (newRefreshToken) {
    res.cookies.set({
      name: 'alibank_refresh',
      value: newRefreshToken,
      path: '/',
      maxAge: 2592000,
      sameSite: 'lax',
      secure: isProd,
    });
  }
}

const MIN_COIN_PRICE_IDR: Record<string, number> = {
  BTC: 500_000_000,
  ETH: 15_000_000,
  BNB: 4_000_000,
  SOL: 800_000,
  USDT: 10_000,
  USDC: 10_000,
  ALX: 500,
  POL: 1_000,
  MATIC: 1_000,
};

export function validateCryptoAmountAgainstIdr(
  cryptoCurrency: string,
  cryptoAmount: number,
  amountIdr: number
): boolean {
  if (!Number.isFinite(cryptoAmount) || cryptoAmount <= 0) return false;
  if (!Number.isFinite(amountIdr) || amountIdr <= 0) return false;
  const symbol = String(cryptoCurrency || '').trim().toUpperCase();
  if (!symbol || !/^[A-Z0-9]{2,12}$/.test(symbol)) return false;

  const minPriceIdr = MIN_COIN_PRICE_IDR[symbol] ?? 100;
  const maxAllowedCrypto = (amountIdr / minPriceIdr) * 2.5;
  return cryptoAmount <= maxAllowedCrypto;
}

