import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

/**
 * POST /api/auth/login
 * Server-side login: Memverifikasi kredensial via Firebase Admin lalu
 * mengembalikan Custom Token untuk sinkronisasi sesi di sisi client.
 * 
 * Keunggulan: Koneksi ke Firebase Auth dilakukan oleh server (IP bersih),
 * sehingga tidak terblokir oleh Tor Browser, VPN, atau firewall browser.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Kata sandi wajib diisi.' }, { status: 400 });
    }

    let cleanEmail = email.trim().toLowerCase();

    // Alias resolution: memetakan aldzulfikar075@gmail.com ke akun admin
    if (cleanEmail === 'aldzulfikar075@gmail.com') {
      cleanEmail = 'alidzulfikar075@gmail.com';
    }

    const adminApp = getAdminApp();
    const auth = getAuth(adminApp);

    // 1. Cari user berdasarkan email
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(cleanEmail);
    } catch (lookupErr: any) {
      if (lookupErr.code === 'auth/user-not-found') {
        return NextResponse.json({ error: 'Akun tidak ditemukan. Silakan mendaftar terlebih dahulu.' }, { status: 404 });
      }
      throw lookupErr;
    }

    // 2. Verifikasi password via Firebase Auth REST API (signInWithPassword)
    //    Firebase Admin SDK tidak punya method verifyPassword, jadi kita panggil REST API
    //    secara langsung dari server (koneksi bersih, anti-blokir Tor).
    const apiKey = 'AIzaSyAY9zcpAlfWuZcY93HMdLo1GW03vjeZhWY';
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
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

    if (!signInRes.ok) {
      const errData = await signInRes.json().catch(() => ({}));
      const errMsg = errData?.error?.message || '';
      
      if (errMsg === 'EMAIL_NOT_FOUND' || errMsg === 'INVALID_LOGIN_CREDENTIALS') {
        return NextResponse.json({ error: 'Email atau kata sandi salah. Silakan periksa kembali.' }, { status: 401 });
      }
      if (errMsg === 'INVALID_PASSWORD') {
        return NextResponse.json({ error: 'Kata sandi salah. Silakan periksa kembali.' }, { status: 401 });
      }
      if (errMsg === 'USER_DISABLED') {
        return NextResponse.json({ error: 'Akun Anda telah dinonaktifkan. Hubungi admin.' }, { status: 403 });
      }
      if (errMsg.startsWith('TOO_MANY_ATTEMPTS_TRY_LATER')) {
        return NextResponse.json({ error: 'Terlalu banyak percobaan. Silakan tunggu beberapa saat.' }, { status: 429 });
      }
      return NextResponse.json({ error: 'Gagal masuk. Silakan coba lagi.' }, { status: 401 });
    }

    // 3. Buat Custom Token untuk sinkronisasi sesi di sisi client
    let customToken: string | null = null;
    try {
      customToken = await auth.createCustomToken(userRecord.uid);
    } catch (tokenErr) {
      console.warn('Gagal membuat custom token:', tokenErr);
    }

    // 4. Response sukses + set session cookie
    const response = NextResponse.json({
      success: true,
      uid: userRecord.uid,
      customToken,
      displayName: userRecord.displayName || '',
      message: 'Login berhasil.',
    });

    response.cookies.set({
      name: 'alibank_session',
      value: '1',
      path: '/',
      maxAge: 2592000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err: any) {
    console.error('Server login error:', err);
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

