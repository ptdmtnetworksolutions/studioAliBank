import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getLocalDoc, setLocalDoc, addLocalCollectionDoc } from '@/lib/local-firestore-store';
import { dispatchUserNotification } from '@/lib/notifications-server';
import {
  extractRequestTokens,
  verifyFirebaseToken,
  attachAuthCookies,
} from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

const MOBA_CLAIM_COOLDOWN_MS = 60_000;
const mobaClaimCooldowns = new Map<string, number>();

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

export async function POST(req: NextRequest) {
  try {
    const { idToken: rawIdToken, refreshToken: rawRefreshToken } = extractRequestTokens(req);
    if (!rawIdToken && !rawRefreshToken) {
      return NextResponse.json({ error: 'Akses ditolak. Token autentikasi diperlukan.' }, { status: 401 });
    }

    const caller = await verifyFirebaseToken(rawIdToken, rawRefreshToken);
    if (!caller) {
      return NextResponse.json({ error: 'Sesi kedaluwarsa atau tidak valid.' }, { status: 401 });
    }

    const userId = caller.uid;
    const userEmail = caller.email || 'user_moba@alibank.com';

    const nowMs = Date.now();
    const lastClaimAt = mobaClaimCooldowns.get(userId) || 0;
    if (nowMs - lastClaimAt < MOBA_CLAIM_COOLDOWN_MS) {
      const waitSec = Math.ceil((MOBA_CLAIM_COOLDOWN_MS - (nowMs - lastClaimAt)) / 1000);
      return NextResponse.json(
        { error: `Cooldown klaim MOBA aktif. Silakan tunggu ${waitSec} detik sebelum klaim berikutnya.` },
        { status: 429 }
      );
    }

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

    mobaClaimCooldowns.set(userId, nowMs);
    if (mobaClaimCooldowns.size > 5000) {
      for (const [k, ts] of mobaClaimCooldowns.entries()) {
        if (nowMs - ts > MOBA_CLAIM_COOLDOWN_MS) mobaClaimCooldowns.delete(k);
      }
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

    const res = NextResponse.json({
      success: true,
      rewardAmount,
      txId,
      message: `Hadiah ${rewardAmount} ALX berhasil dikreditkan ke saldo Anda!`,
    });
    attachAuthCookies(res, caller.newIdToken, caller.newRefreshToken);
    return res;
  } catch (err: any) {
    console.error('[MOBA Reward Claim Error]:', err.message);
    return NextResponse.json(
      { error: err.message || 'Gagal mengklaim hadiah game.' },
      { status: 500 }
    );
  }
}
