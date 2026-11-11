import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';
import { getLocalDoc, setLocalDoc, addLocalCollectionDoc } from '@/lib/local-firestore-store';
import { dispatchUserNotification } from '@/lib/notifications-server';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

async function verifyCaller(token: string): Promise<{ uid: string; email: string } | null> {
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
      if (u?.localId) return { uid: u.localId, email: u.email || 'user_moba@alibank.com' };
    }
  } catch {}
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
    if (decoded?.uid) return { uid: decoded.uid, email: decoded.email || 'user_moba@alibank.com' };
  } catch {}
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      const uid = payload.user_id || payload.sub;
      if (uid) return { uid, email: payload.email || 'user_moba@alibank.com' };
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

    const caller = await verifyCaller(token);
    if (!caller) {
      return NextResponse.json({ error: 'Sesi kedaluwarsa atau tidak valid.' }, { status: 401 });
    }

    const userId = caller.uid;
    const userEmail = caller.email;

    const localUser = getLocalDoc(`users/${userId}`);
    let userData: Record<string, any> | null = localUser.exists ? localUser.data : null;

    if (!userData) {
      try {
        const db = getFirestore(getAdminApp());
        const snap = await db.collection('users').doc(userId).get();
        if (snap.exists) userData = { id: snap.id, ...snap.data() };
      } catch {}
    }

    if (!userData) {
      return NextResponse.json({ error: 'Akun pengguna tidak ditemukan.' }, { status: 404 });
    }

    if (userData.isSuspended) {
      return NextResponse.json({ error: 'Akun Anda dibekukan sementara karena alasan keamanan.' }, { status: 403 });
    }

    const rewardAmount = 0.1;
    const now = new Date().toISOString();
    const txId = `MOBA-${Date.now()}`;

    const nextCrypto = { ...(userData.cryptoBalances || {}) };
    nextCrypto.ALX = Number(((Number(nextCrypto.ALX || 0)) + rewardAmount).toFixed(8));

    setLocalDoc(`users/${userId}`, { cryptoBalances: nextCrypto }, true);
    addLocalCollectionDoc(`users/${userId}/transactions`, {
      id: txId,
      date: now,
      description: 'Menang Pertempuran MOBA AliBank',
      category: 'Game',
      amount: 0,
      cryptoAmount: rewardAmount,
      cryptoCurrency: 'ALX',
      type: 'income',
      status: 'success',
      transferId: txId,
      timestamp: now,
    });
    addLocalCollectionDoc('system/audit/global_transactions', {
      id: txId,
      category: 'Game Win',
      gateway: 'Ali-MOBA Engine',
      amountIdr: 0,
      cryptoAmount: rewardAmount,
      cryptoCurrency: 'ALX',
      status: 'success',
      timestamp: now,
      userEmail,
      description: `User won MOBA match. Credited ${rewardAmount} ALX. ID: ${txId}`,
    });
    try {
      const db = getFirestore(getAdminApp());
      const userRef = db.collection('users').doc(userId);
      await db.runTransaction(async (transaction) => {
        transaction.update(userRef, {
          'cryptoBalances.ALX': FieldValue.increment(rewardAmount),
        });
        transaction.set(userRef.collection('transactions').doc(txId), {
          date: now,
          description: 'Menang Pertempuran MOBA AliBank',
          category: 'Game',
          cryptoAmount: rewardAmount,
          cryptoCurrency: 'ALX',
          type: 'income',
          status: 'success',
          transferId: txId,
          timestamp: FieldValue.serverTimestamp(),
        });
      });
    } catch {}

    await dispatchUserNotification(userId, {
      title: '🏆 Kemenangan MOBA!',
      message: `Selamat! Anda memenangkan pertempuran di AliBank Arena dan memperoleh hadiah ${rewardAmount} ALX.`,
      type: 'success',
      category: 'marketing',
      cryptoAmount: rewardAmount,
      cryptoCurrency: 'ALX',
      actionUrl: '/games/moba',
    });

    return NextResponse.json({
      success: true,
      rewardAmount,
      txId,
      message: `Hadiah ${rewardAmount} ALX berhasil dikreditkan ke saldo Anda!`,
    });
  } catch (err: any) {
    console.error('[MOBA Reward Claim Error]:', err.message);
    return NextResponse.json(
      { error: err.message || 'Gagal mengklaim hadiah game.' },
      { status: 500 }
    );
  }
}
