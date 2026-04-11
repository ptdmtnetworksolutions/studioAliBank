import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview Server-side proxy for Binance 24hr Ticker API.
 * Optimized for Production with User-Agent and Fallback Nodes.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');
  const symbol = searchParams.get('symbol');

  // Gunakan api1 untuk reliabilitas lebih tinggi di lingkungan Cloud
  let url = 'https://api1.binance.com/api/v3/ticker/24hr';
  
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 10 } 
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Binance Node Error (${response.status}):`, errorText);
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