import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    // 1. Validasi input dasar
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nama lengkap wajib diisi.' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Kata sandi minimal 6 karakter.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = (phone || '').trim();

    const adminApp = getAdminApp();
    const auth = getAuth(adminApp);
    const db = getFirestore(adminApp);

    // 2. Buat akun di Firebase Auth menggunakan Firebase Admin (bebas dari pemblokiran Tor/Browser)
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: cleanEmail,
        password: password,
        displayName: cleanName,
      });
    } catch (authError: any) {
      console.error('Firebase Admin createUser error:', authError);
      if (authError.code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'Email sudah terdaftar. Silakan masuk dengan akun Anda.' }, { status: 409 });
      }
      if (authError.code === 'auth/invalid-password') {
        return NextResponse.json({ error: 'Kata sandi terlalu lemah atau tidak valid.' }, { status: 400 });
      }
      return NextResponse.json({ error: authError.message || 'Gagal membuat akun autentikasi.' }, { status: 400 });
    }

    // 3. Buat Internal Web3 Wallet & Simulated BTC address
    const internalWallet = ethers.Wallet.createRandom();
    const mockBtcSuffix = Array.from({ length: 38 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
    const mockBtcAddress = `bc1q${mockBtcSuffix}`;
    const accountNumber = '88' + Math.floor(1000000000 + Math.random() * 9000000000).toString();

    // 4. Simpan profil lengkap user ke Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      accountNumber,
      totalBalance: 0,
      savings: 0,
      tier: 'Regular',
      kycStatus: 'unverified',
      walletAddress: internalWallet.address,
      btcAddress: mockBtcAddress,
      cryptoBalances: {
        BTC: 0,
        ETH: 0,
        USDT: 0,
        ALX: 0
      },
      createdAt: FieldValue.serverTimestamp()
    });

    // 5. Buat Custom Token untuk sinkronisasi sesi client
    let customToken: string | null = null;
    try {
      customToken = await auth.createCustomToken(userRecord.uid);
    } catch (tokenErr) {
      console.warn('Gagal membuat custom token:', tokenErr);
    }

    // 6. Buat response dan set cookie alibank_session
    const response = NextResponse.json({
      success: true,
      uid: userRecord.uid,
      customToken,
      message: 'Pendaftaran akun AliBank berhasil.'
    });

    response.cookies.set({
      name: 'alibank_session',
      value: '1',
      path: '/',
      maxAge: 2592000, // 30 hari
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err: any) {
    console.error('Server registration error:', err);
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan server saat mendaftar. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

