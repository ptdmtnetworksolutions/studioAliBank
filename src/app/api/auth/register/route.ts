import { NextRequest, NextResponse } from 'next/server';
import { firebaseConfig } from '@/firebase/config';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/register
 * Mendaftarkan akun via Google Identity Toolkit REST API dan menyimpan
 * data profil awal ke Firestore. Tidak memerlukan Google Cloud ADC.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

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
    const apiKey = firebaseConfig.apiKey;

    // 1. Buat user di Firebase Auth via Google Identity Toolkit REST API
    const signUpRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const signUpData = await signUpRes.json();

    if (!signUpRes.ok) {
      const errMsg = signUpData?.error?.message || '';
      if (errMsg === 'EMAIL_EXISTS') {
        return NextResponse.json({ error: 'Email sudah terdaftar. Silakan masuk.' }, { status: 409 });
      }
      if (errMsg.startsWith('WEAK_PASSWORD')) {
        return NextResponse.json({ error: 'Kata sandi terlalu lemah. Minimal 6 karakter.' }, { status: 400 });
      }
      return NextResponse.json({ error: errMsg || 'Gagal mendaftar.' }, { status: 400 });
    }

    const uid = signUpData.localId;
    const idToken = signUpData.idToken;

    // 2. Set displayName
    try {
      await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken,
            displayName: cleanName,
            returnSecureToken: true,
          }),
        }
      );
    } catch (_) {}

    // 3. Web3 Wallet & Simulated BTC address
    const internalWallet = ethers.Wallet.createRandom();
    const mockBtcSuffix = Array.from({ length: 38 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
    const mockBtcAddress = `bc1q${mockBtcSuffix}`;
    const accountNumber = '88' + Math.floor(1000000000 + Math.random() * 9000000000).toString();

    // 4. Simpan ke Firestore via REST API menggunakan idToken user
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${uid}`;
    
    try {
      await fetch(firestoreUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          fields: {
            uid: { stringValue: uid },
            name: { stringValue: cleanName },
            email: { stringValue: cleanEmail },
            phone: { stringValue: cleanPhone },
            accountNumber: { stringValue: accountNumber },
            totalBalance: { integerValue: "0" },
            savings: { integerValue: "0" },
            tier: { stringValue: 'Regular' },
            kycStatus: { stringValue: 'unverified' },
            walletAddress: { stringValue: internalWallet.address },
            btcAddress: { stringValue: mockBtcAddress },
            cryptoBalances: {
              mapValue: {
                fields: {
                  BTC: { integerValue: "0" },
                  ETH: { integerValue: "0" },
                  USDT: { integerValue: "0" },
                  ALX: { integerValue: "0" }
                }
              }
            },
            createdAt: { timestampValue: new Date().toISOString() }
          }
        }),
      });
    } catch (fsErr) {
      console.warn('Firestore write warning:', fsErr);
    }

    const response = NextResponse.json({
      success: true,
      uid,
      idToken,
      refreshToken: signUpData.refreshToken,
      message: 'Pendaftaran akun AliBank berhasil.',
    });

    const isProd = process.env.NODE_ENV === 'production';

    response.cookies.set({
      name: 'alibank_session',
      value: '1',
      path: '/',
      maxAge: 2592000,
      sameSite: 'lax',
      secure: isProd,
    });

    if (idToken) {
      response.cookies.set({
        name: 'alibank_token',
        value: idToken,
        path: '/',
        maxAge: 2592000,
        sameSite: 'lax',
        secure: isProd,
      });
    }

    if (signUpData.refreshToken) {
      response.cookies.set({
        name: 'alibank_refresh',
        value: signUpData.refreshToken,
        path: '/',
        maxAge: 2592000,
        sameSite: 'lax',
        secure: isProd,
      });
    }

    return response;
  } catch (err: any) {
    console.error('Server registration error:', err);
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan server saat mendaftar.' },
      { status: 500 }
    );
  }
}
