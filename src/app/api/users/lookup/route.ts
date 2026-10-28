import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

/**
 * GET /api/users/lookup?q=...
 * Safe user lookup for transfers.
 * Authenticated via Bearer ID token.
 * Returns only non-sensitive public identity fields (id, name, accountNumber, walletAddress, avatarUrl).
 */
export async function GET(request: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const auth = getAuth(adminApp);
    const db = getFirestore(adminApp);

    // 1. Verifikasi Token Otentikasi
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Akses ditolak. Token otentikasi diperlukan.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Sesi kedaluwarsa atau tidak valid.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || searchParams.get('query') || '').trim();

    if (q.length < 3) {
      return NextResponse.json({ error: 'Kata kunci pencarian minimal 3 karakter.' }, { status: 400 });
    }

    const usersCol = db.collection('users');

    // Query paralel berdasarkan nomor rekening, wallet address, atau email
    const [snapAcc, snapWallet, snapEmail] = await Promise.all([
      usersCol.where('accountNumber', '==', q).limit(1).get(),
      usersCol.where('walletAddress', '==', q).limit(1).get(),
      usersCol.where('email', '==', q.toLowerCase()).limit(1).get(),
    ]);

    const foundDoc = !snapAcc.empty 
      ? snapAcc.docs[0] 
      : !snapWallet.empty 
        ? snapWallet.docs[0] 
        : !snapEmail.empty 
          ? snapEmail.docs[0] 
          : null;

    if (!foundDoc) {
      return NextResponse.json({ user: null, message: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    const data = foundDoc.data();

    // Kembalikan HANYA data publik non-sensitif (tanpa saldo, KYC, atau private key)
    return NextResponse.json({
      user: {
        id: foundDoc.id,
        name: data.name || 'Nasabah AliBank',
        accountNumber: data.accountNumber || '-',
        walletAddress: data.walletAddress || '-',
        avatarUrl: data.avatarUrl || null,
      }
    });

  } catch (error: any) {
    console.error('[User Lookup Route Error]:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server saat mencari pengguna.' }, { status: 500 });
  }
}
