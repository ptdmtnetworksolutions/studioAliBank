import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getLocalDoc, setLocalDoc } from '@/lib/local-firestore-store';
import {
  extractRequestTokens,
  verifyFirebaseToken,
  attachAuthCookies,
} from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken: rawIdToken, refreshToken: rawRefreshToken } = extractRequestTokens(req, body);

    if (!rawIdToken && !rawRefreshToken) {
      return NextResponse.json({ error: 'Akses ditolak. Token autentikasi diperlukan.' }, { status: 401 });
    }

    const caller = await verifyFirebaseToken(rawIdToken, rawRefreshToken);
    if (!caller) {
      return NextResponse.json({ error: 'Sesi kedaluwarsa atau tidak valid.' }, { status: 401 });
    }

    const userId = caller.uid;
    const { emblemType, newLevel } = body;

    if (!emblemType || typeof newLevel !== 'number' || !Number.isInteger(newLevel) || newLevel < 1 || newLevel > 60) {
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

    const res = NextResponse.json({
      success: true,
      message: `Emblem ${emblemType} berhasil ditingkatkan ke Level ${newLevel}!`,
      emblemType,
      newLevel,
    });
    attachAuthCookies(res, caller.newIdToken, caller.newRefreshToken);
    return res;
  } catch (err: any) {
    console.error('[MOBA Emblem Upgrade Error]:', err.message);
    return NextResponse.json(
      { error: err.message || 'Gagal menyimpan status emblem.' },
      { status: 500 }
    );
  }
}
