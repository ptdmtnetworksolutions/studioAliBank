
import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview Server-side proxy for Binance 24hr Ticker API.
 * Bypasses CORS issues and provides a stable bridge for market data.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');
  const symbol = searchParams.get('symbol');

  let url = 'https://api.binance.com/api/v3/ticker/24hr';
  
  if (symbols) {
    url += `?symbols=${symbols}`;
  } else if (symbol) {
    url += `?symbol=${symbol}`;
  }

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
    console.error('Market Proxy Ticker Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to synchronize with global market nodes.' }, 
      { status: 502 }
    );
  }
}
