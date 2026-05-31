
'use server';

/**
 * @fileOverview Server Actions untuk integrasi Midtrans yang aman.
 * Mendelegasikan pembuatan token ke API route internal /api/payments/midtrans-token
 * yang menggunakan Firebase Admin SDK untuk membaca Server Key dengan aman.
 */

export async function createMidtransSnapTokenAction(
  orderId: string,
  amount: number,
  customerName: string,
  customerEmail: string
) {
  // Determine the base URL for the internal API call
  // In production (Firebase App Hosting), NEXTAUTH_URL or NEXT_PUBLIC_APP_URL can be set.
  // For internal server-to-server calls, use localhost in dev and the internal host in prod.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`
    || 'http://localhost:9005';

  try {
    const response = await fetch(`${baseUrl}/api/payments/midtrans-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, amount, customerName, customerEmail }),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Gagal membuat token Midtrans (${response.status}).`);
    }

    return {
      token: data.token as string,
      redirect_url: data.redirect_url as string
    };
  } catch (err: any) {
    console.error('[Midtrans Action Error]:', err?.message || err);
    throw new Error(err.message || 'Hambatan koneksi gateway Midtrans terdeteksi.');
  }
}
