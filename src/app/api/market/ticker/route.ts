
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * @fileOverview Server-side proxy for Binance 24hr Ticker API.
 * Diperbarui dengan ketahanan tinggi untuk lingkungan produksi Firebase App Hosting.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');
  const symbol = searchParams.get('symbol');

  let url = 'https://api.binance.com/api/v3/ticker/24hr';
  
  if (symbols) {
    url += `?symbols=${symbols}`;
  } else if (symbol) {
    const sanitizedSymbol = symbol === 'USDT' ? 'USDTIDRT' : (symbol.includes('USDT') ? symbol : `${symbol}USDT`);
    url += `?symbol=${sanitizedSymbol}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s strict timeout

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AliBank-V3-Core/1.2-Live',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      cache: 'no-store',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Node bursa sedang sibuk (Rate Limit).',
        status: response.status 
      }, { 
        status: 200,
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('[Ticker Proxy Error]:', error.message);
    return NextResponse.json(
      { error: 'Hambatan koneksi pada node harga global.', isNetworkError: true }, 
      { status: 200 }
    );
  }
}
