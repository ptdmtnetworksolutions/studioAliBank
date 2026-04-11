import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview Server-side proxy for Binance 24hr Ticker API.
 * Optimized for Production with Cluster Redundancy.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');
  const symbol = searchParams.get('symbol');

  // Gunakan api3 untuk stabilitas lebih tinggi di lingkungan Cloud Hosting
  let url = 'https://api3.binance.com/api/v3/ticker/24hr';
  
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
        'User-Agent': 'AliBank-V3-Core/1.0 (Production Node)'
      },
      next: { revalidate: 10 } 
    });

    if (!response.ok) {
      console.error(`Binance Node Error (${response.status})`);
      return NextResponse.json({ error: 'Upstream node rejected request.' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Market Proxy Ticker Exception:', error.message);
    return NextResponse.json(
      { error: 'Failed to synchronize with global market nodes.' }, 
      { status: 503 }
    );
  }
}