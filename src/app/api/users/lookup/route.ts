import { NextRequest, NextResponse } from 'next/server';
import { firebaseConfig } from '@/firebase/config';
import { getLocalDoc, queryLocalCollection, setLocalDoc } from '@/lib/local-firestore-store';
import {
  extractRequestTokens,
  verifyFirebaseToken,
  attachAuthCookies,
} from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

function parseRestDoc(docObj: any): Record<string, any> {
  const nameParts = (docObj?.name || '').split('/');
  const id = nameParts[nameParts.length - 1] || '';
  const fields = docObj?.fields || {};
  const out: Record<string, any> = { id };
  for (const [k, v] of Object.entries(fields) as Array<[string, any]>) {
    if (v && typeof v === 'object') {
      if ('stringValue' in v) out[k] = String(v.stringValue);
      else if ('integerValue' in v) out[k] = Number(v.integerValue);
      else if ('doubleValue' in v) out[k] = Number(v.doubleValue);
      else if ('booleanValue' in v) out[k] = Boolean(v.booleanValue);
      else out[k] = null;
    }
  }
  return out;
}

async function queryUsersByFieldRest(field: string, value: string, token: string): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'users' }],
          where: {
            fieldFilter: {
              field: { fieldPath: field },
              op: 'EQUAL',
              value: { stringValue: value },
            },
          },
          limit: 1,
        },
      }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const rows = await res.json().catch(() => []);
    if (Array.isArray(rows)) {
      for (const row of rows) {
        if (row?.document) {
          return parseRestDoc(row.document);
        }
      }
    }
  } catch {}
  return null;
}

function findUserInLocalStore(q: string): Record<string, any> | null {
  const clean = q.trim();
  const lower = clean.toLowerCase();

  // Direct ID check
  const direct = getLocalDoc(`users/${clean}`);
  if (direct.exists && direct.data) return direct.data;

  const localUsers = queryLocalCollection('users', null, [], [], 1000);
  for (const u of localUsers) {
    if (
      String(u.accountNumber || '').trim() === clean ||
      String(u.id || '').trim() === clean ||
      String(u.uid || '').trim() === clean ||
      String(u.email || '').trim().toLowerCase() === lower ||
      String(u.walletAddress || '').trim().toLowerCase() === lower
    ) {
      return u;
    }
  }
  return null;
}

/**
 * GET /api/users/lookup?q=...
 * Safe user lookup for transfers.
 * Authenticated via Bearer ID token or alibank_token cookie.
 * Returns only non-sensitive public identity fields (id, name, accountNumber, walletAddress, avatarUrl).
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verifikasi Token Otentikasi
    const { idToken: rawIdToken, refreshToken: rawRefreshToken } = extractRequestTokens(request);
    if (!rawIdToken && !rawRefreshToken) {
      return NextResponse.json({ error: 'Akses ditolak. Token otentikasi diperlukan.' }, { status: 401 });
    }

    const caller = await verifyFirebaseToken(rawIdToken, rawRefreshToken);
    if (!caller) {
      return NextResponse.json({ error: 'Sesi kedaluwarsa atau tidak valid.' }, { status: 401 });
    }

    const token = caller.idToken;

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || searchParams.get('query') || '').trim();

    if (q.length < 3) {
      return NextResponse.json({ error: 'Kata kunci pencarian minimal 3 karakter.' }, { status: 400 });
    }

    // 1. Cari di Local Firestore Store terlebih dahulu (instan & kebal kuota 429)
    let found = findUserInLocalStore(q);

    // 2. Jika belum ditemukan di local store, query paralel via Firestore REST API
    if (!found) {
      const [byAcc, byWallet, byEmail] = await Promise.all([
        queryUsersByFieldRest('accountNumber', q, token),
        queryUsersByFieldRest('walletAddress', q, token),
        queryUsersByFieldRest('email', q.toLowerCase(), token),
      ]);
      found = byAcc || byWallet || byEmail;
      if (found?.id) {
        setLocalDoc(`users/${found.id}`, found, true);
      }
    }

    if (!found) {
      return NextResponse.json({ user: null, message: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Kembalikan HANYA data publik non-sensitif (tanpa saldo, KYC, atau private key)
    const res = NextResponse.json({
      user: {
        id: found.id || found.uid,
        name: found.name || 'Nasabah AliBank',
        accountNumber: found.accountNumber || '-',
        walletAddress: found.walletAddress || '-',
        avatarUrl: found.avatarUrl || null,
      }
    });
    attachAuthCookies(res, caller.newIdToken, caller.newRefreshToken);
    return res;

  } catch (error: any) {
    console.error('[User Lookup Route Error]:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server saat mencari pengguna.' }, { status: 500 });
  }
}
