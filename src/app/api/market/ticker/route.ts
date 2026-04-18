import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview Server-side proxy for Binance 24hr Ticker API.
 * Diperbarui untuk mendukung penanganan beban tinggi (48+ koin).
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');
  const symbol = searchParams.get('symbol');

  let url = 'https://api.binance.com/api/v3/ticker/24hr';
  
  if (symbols) {
    url += `?symbols=${symbols}`;
  } else if (symbol) {
    const sanitizedSymbol = symbol === 'USDTIDR' ? 'USDTIDRT' : symbol;
    url += `?symbol=${sanitizedSymbol}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // Meningkatkan timeout ke 12 detik

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AliBank-V3-Core/1.1'
      },
      next: { revalidate: 10 }, // Cache singkat di sisi server
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Upstream Market Error [${response.status}]:`, errorText);
      return NextResponse.json({ 
        error: 'Node bursa sedang sibuk.',
        status: response.status 
      }, { status: 200 }); // Kembalikan 200 agar client tidak melempar eksepsi keras
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Market Proxy Ticker Exception:', error.message);
    return NextResponse.json(
      { error: 'Hambatan koneksi pada node harga global.', isNetworkError: true }, 
      { status: 200 }
    );
  }
}
