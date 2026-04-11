import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview Server-side proxy for Binance Klines (Candlestick) API.
 * Optimized for Production with User-Agent headers.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');
  const limit = searchParams.get('limit');

  if (!symbol || !interval) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const url = `https://api1.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit || 60}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 10 }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Klines node communication failed.' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Market Proxy Klines Exception:', error.message);
    return NextResponse.json(
      { error: 'Failed to synchronize candlestick data.' }, 
      { status: 503 }
    );
  }
}