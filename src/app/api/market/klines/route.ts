
import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview Server-side proxy for Binance Klines (Candlestick) API.
 * Ensures stable chart data delivery without client-side network interference.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');
  const limit = searchParams.get('limit');

  if (!symbol || !interval) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit || 60}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 10 } // Cache for 10 seconds
    });

    if (!response.ok) {
      throw new Error(`Binance API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Market Proxy Klines Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to synchronize candlestick data.' }, 
      { status: 502 }
    );
  }
}
