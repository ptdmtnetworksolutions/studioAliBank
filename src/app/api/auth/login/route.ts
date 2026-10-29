import { NextRequest, NextResponse } from 'next/server';
import { firebaseConfig } from '@/firebase/config';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/login
 * Memverifikasi email & password secara aman via Google Identity Toolkit REST API
 * langsung dari server Next.js (IP bersih datacenter, bebas blokir Tor/VPN).
 * Tidak memerlukan Google Cloud ADC / service account key.
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
    // Alias admin: aldzulfikar075 -> alidzulfikar075
    if (cleanEmail === 'aldzulfikar075@gmail.com') {
      cleanEmail = 'alidzulfikar075@gmail.com';
    }

    const apiKey = firebaseConfig.apiKey;
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

    const data = await signInRes.json();

    if (!signInRes.ok) {
      const errMsg = data?.error?.message || '';
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
      return NextResponse.json({ error: 'Email atau kata sandi salah. Silakan periksa kembali.' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      uid: data.localId,
      email: data.email,
      displayName: data.displayName || '',
      idToken: data.idToken,
      refreshToken: data.refreshToken,
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
      { error: 'Terjadi kesalahan server saat masuk. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
