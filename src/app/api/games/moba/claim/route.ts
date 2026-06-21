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

    // 1. Verify User Session Token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Akses ditolak. Token autentikasi diperlukan.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth(adminApp).verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || 'user_moba@alibank.com';

    // 2. Load User Profile and check status
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'Akun pengguna tidak ditemukan.' }, { status: 404 });
    }

    const userData = userSnap.data()!;
    if (userData.isSuspended) {
      return NextResponse.json({ error: 'Akun Anda dibekukan sementara karena alasan keamanan.' }, { status: 403 });
    }

    // 3. Set reward amount (0.1 ALX per win)
    const rewardAmount = 0.1;
    const now = new Date().toISOString();
    const txId = `MOBA-${Date.now()}`;

    // 4. Perform atomic update
    await db.runTransaction(async (transaction) => {
      // Credit ALX balance
      transaction.update(userRef, {
        'cryptoBalances.ALX': FieldValue.increment(rewardAmount)
      });

      // Add to user transactions subcollection
      const userTxRef = userRef.collection('transactions').doc();
      transaction.set(userTxRef, {
        date: now,
        description: 'Menang Pertempuran MOBA AliBank',
        category: 'Game',
        cryptoAmount: rewardAmount,
        cryptoCurrency: 'ALX',
        type: 'income',
        status: 'success',
        transferId: txId,
        timestamp: FieldValue.serverTimestamp()
      });

      // Add to global audit trail
      const auditRef = db.collection('system').doc('audit').collection('global_transactions').doc();
      transaction.set(auditRef, {
        id: txId,
        category: 'Game Win',
        gateway: 'Ali-MOBA Engine',
        amountIdr: 0,
        cryptoAmount: rewardAmount,
        cryptoCurrency: 'ALX',
        status: 'success',
        timestamp: FieldValue.serverTimestamp(),
        userEmail: userEmail,
        description: `User won MOBA match. Credited ${rewardAmount} ALX. ID: ${txId}`
      });

      // Add in-app notification
      const notifRef = userRef.collection('notifications').doc();
      transaction.set(notifRef, {
        title: '🏆 Kemenangan MOBA!',
        message: `Selamat! Anda memenangkan pertempuran dan memperoleh hadiah ${rewardAmount} ALX.`,
        type: 'success',
        read: false,
        createdAt: now,
        timestamp: FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({
      success: true,
      rewardAmount,
      txId,
      message: `Hadiah ${rewardAmount} ALX berhasil dikreditkan ke saldo Anda!`
    });

  } catch (err: any) {
    console.error('[MOBA Reward Claim Error]:', err.message);
    return NextResponse.json(
      { error: err.message || 'Gagal mengklaim hadiah game.' },
      { status: 500 }
    );
  }
}
