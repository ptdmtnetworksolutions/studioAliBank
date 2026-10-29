import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

export async function POST(req: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);

    // 1. Verify token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Akses ditolak. Token autentikasi diperlukan.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth(adminApp).verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await req.json();
    const { emblemType, newLevel } = body;

    if (!emblemType || typeof newLevel !== 'number' || newLevel < 1 || newLevel > 60) {
      return NextResponse.json({ error: 'Level emblem tidak valid.' }, { status: 400 });
    }

    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      moba_emblems: {
        [emblemType]: newLevel
      }
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: `Emblem ${emblemType} berhasil ditingkatkan ke Level ${newLevel}!`,
      emblemType,
      newLevel
    });
  } catch (err: any) {
    console.error('[MOBA Emblem Upgrade Error]:', err.message);
    return NextResponse.json(
      { error: err.message || 'Gagal menyimpan status emblem.' },
      { status: 500 }
    );
  }
}

