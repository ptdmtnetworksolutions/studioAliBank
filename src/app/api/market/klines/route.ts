
import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview Server-side proxy for Binance Klines (Candlestick) API.
 * Diperbarui dengan header anti-cache untuk akurasi grafik live.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');
  const limit = searchParams.get('limit');

  if (!symbol || !interval) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const url = `https://api3.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit || 60}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AliBank-V3-Core/1.0 (Production Node)'
      },
      cache: 'no-store'
    });

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
    console.error('Market Proxy Klines Exception:', error.message);
    return NextResponse.json(
      { error: 'Failed to synchronize candlestick data.' }, 
      { status: 503 }
    );
  }
}
