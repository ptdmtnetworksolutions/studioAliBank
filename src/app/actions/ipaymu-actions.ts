'use server';

/**
 * @fileOverview Server Actions untuk integrasi iPaymu yang aman.
 * Mendelegasikan pembuatan link pembayaran ke API route internal /api/payments/ipaymu-token.
 */

export async function createIpaymuPaymentAction(
  orderId: string,
  amount: number,
  customerName: string,
  customerEmail: string,
  userId: string,
  cryptoAmount: number,
  cryptoCurrency: string,
  usdValue: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    || 'http://localhost:9005';

  try {
    const response = await fetch(`${baseUrl}/api/payments/ipaymu-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        orderId, 
        amount, 
        customerName, 
        customerEmail,
        userId,
        cryptoAmount,
        cryptoCurrency,
        usdValue
      }),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Gagal membuat link pembayaran iPaymu (${response.status}).`);
    }

    return {
      redirectUrl: data.redirectUrl as string
    };
  } catch (err: any) {
    console.error('[iPaymu Action Error]:', err?.message || err);
    throw new Error(err.message || 'Hambatan koneksi gateway iPaymu terdeteksi.');
  }
}
