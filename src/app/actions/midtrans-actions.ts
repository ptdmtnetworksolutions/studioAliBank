
'use server';

/**
 * @fileOverview Server Actions untuk integrasi Midtrans yang aman.
 * Menangani pembuatan Snap Token tanpa mengekspos Server Key ke klien.
 */

export async function createMidtransSnapTokenAction(
  orderId: string,
  amount: number,
  customerName: string,
  customerEmail: string,
  serverKey: string
) {
  if (!serverKey) {
    throw new Error('Midtrans Server Key belum dikonfigurasi di Vault.');
  }

  // Basic Auth header menggunakan Server Key (Tanpa password)
  const authHeader = Buffer.from(`${serverKey}:`).toString('base64');

  try {
    // Gunakan URL Production atau Sandbox berdasarkan prefix key
    const isProduction = !serverKey.startsWith('SB-');
    const baseUrl = isProduction 
      ? 'https://app.midtrans.com/snap/v1/transactions' 
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authHeader}`
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: amount
        },
        customer_details: {
          first_name: customerName,
          email: customerEmail
        },
        credit_card: {
          secure: true
        },
        expiry: {
          duration: 1,
          unit: 'days'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_messages?.[0] || 'Gagal membuat token pembayaran Midtrans.');
    }

    return {
      token: data.token,
      redirect_url: data.redirect_url
    };
  } catch (err: any) {
    console.error('Midtrans Action Error:', err);
    throw new Error(err.message || 'Hambatan node kliring Midtrans terdeteksi.');
  }
}
