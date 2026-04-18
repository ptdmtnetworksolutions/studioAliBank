import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview Server-side proxy for Binance Klines API.
 * Diperbarui untuk mendukung pengambilan data tren masif secara stabil.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');
  const limit = searchParams.get('limit');

  if (!symbol || !interval) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const sanitizedSymbol = symbol === 'USDTIDR' ? 'USDTIDRT' : symbol;
  const url = `https://api.binance.com/api/v3/klines?symbol=${sanitizedSymbol}&interval=${interval}&limit=${limit || 60}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 detik timeout

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AliBank-V3-Core/1.1'
      },
      next: { revalidate: 60 }, // Cache klines lebih lama karena data historis
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({ error: 'Klines node busy' }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=60',
      }
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    return NextResponse.json(
      { error: 'Klines node timeout' }, 
      { status: 200 }
    );
  }
}
