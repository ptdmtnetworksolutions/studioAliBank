
import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview Server-side proxy for Binance 24hr Ticker API.
 * Dioptimalkan untuk Production dengan bypass cache total agar Kurs selalu Real-Time.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');
  const symbol = searchParams.get('symbol');

  // Gunakan api3 untuk stabilitas lebih tinggi di lingkungan Cloud
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
      // KRITIS: Pastikan tidak ada caching di tingkat Next.js
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Binance Upstream Error:', errorData);
      return NextResponse.json({ error: 'Node bursa global tidak merespons.' }, { status: 502 });
    }

    const data = await response.json();
    
    // Kirim respons dengan header anti-cache yang sangat ketat untuk lingkungan Live
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error: any) {
    console.error('Market Proxy Ticker Exception:', error.message);
    return NextResponse.json(
      { error: 'Kegagalan pada node sinkronisasi harga pasar.' }, 
      { status: 503 }
    );
  }
}
