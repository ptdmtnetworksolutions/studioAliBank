
import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview Server-side proxy for Binance Klines API.
 * Diperbarui dengan timeout dan anti-cache untuk akurasi grafik live di produksi.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');
  const limit = searchParams.get('limit');

  if (!symbol || !interval) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // Koreksi simbol
  const sanitizedSymbol = symbol === 'USDTIDR' ? 'USDTIDRT' : symbol;
  const url = `https://api.binance.com/api/v3/klines?symbol=${sanitizedSymbol}&interval=${interval}&limit=${limit || 60}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AliBank-V3-Core/1.1'
      },
      cache: 'no-store',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({ error: 'Klines node communication failed.' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Market Proxy Klines Exception:', error.message);
    return NextResponse.json(
      { error: 'Failed to synchronize candlestick data.' }, 
      { status: 504 }
    );
  }
}
