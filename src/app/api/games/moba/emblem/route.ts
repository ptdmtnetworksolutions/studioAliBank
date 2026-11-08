import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';
import { getLocalDoc, setLocalDoc } from '@/lib/local-firestore-store';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

async function verifyCallerUid(token: string): Promise<string | null> {
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
      const data = await res.json();
      const u = data?.users?.[0];
      if (u?.localId) return u.localId;
    }
  } catch {}
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
    if (decoded?.uid) return decoded.uid;
  } catch {}
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      return payload.user_id || payload.sub || null;
    }
  } catch {}
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
    const cookieToken = req.cookies.get('alibank_token')?.value || '';
    const token = bearerToken || cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'Akses ditolak. Token autentikasi diperlukan.' }, { status: 401 });
    }

    const userId = await verifyCallerUid(token);
    if (!userId) {
      return NextResponse.json({ error: 'Sesi kedaluwarsa atau tidak valid.' }, { status: 401 });
    }

    const body = await req.json();
    const { emblemType, newLevel } = body;

    if (!emblemType || typeof newLevel !== 'number' || newLevel < 1 || newLevel > 60) {
      return NextResponse.json({ error: 'Level emblem tidak valid.' }, { status: 400 });
    }

    const localUser = getLocalDoc(`users/${userId}`);
    const prevEmblems = localUser.exists ? (localUser.data?.moba_emblems || {}) : {};
    setLocalDoc(`users/${userId}`, {
      moba_emblems: {
        ...prevEmblems,
        [emblemType]: newLevel,
      },
    }, true);

    try {
      const db = getFirestore(getAdminApp());
      await db.collection('users').doc(userId).set({
        moba_emblems: {
          [emblemType]: newLevel,
        },
      }, { merge: true });
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Emblem ${emblemType} berhasil ditingkatkan ke Level ${newLevel}!`,
      emblemType,
      newLevel,
    });
  } catch (err: any) {
    console.error('[MOBA Emblem Upgrade Error]:', err.message);
    return NextResponse.json(
      { error: err.message || 'Gagal menyimpan status emblem.' },
      { status: 500 }
    );
  }
}
