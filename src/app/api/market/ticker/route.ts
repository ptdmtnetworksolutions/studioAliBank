
import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview Server-side proxy for Binance 24hr Ticker API.
 * Diperbarui dengan Timeout dan penanganan error yang lebih stabil untuk lingkungan Cloud Run.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');
  const symbol = searchParams.get('symbol');

  // Gunakan api.binance.com (Node Utama) untuk stabilitas lebih baik
  let url = 'https://api.binance.com/api/v3/ticker/24hr';
  
  if (symbols) {
    url += `?symbols=${symbols}`;
  } else if (symbol) {
    // Koreksi otomatis jika sistem meminta USDTIDR (yang tidak ada di Binance) ke USDTIDRT
    const sanitizedSymbol = symbol === 'USDTIDR' ? 'USDTIDRT' : symbol;
    url += `?symbol=${sanitizedSymbol}`;
  }

  // Mekanisme AbortController untuk mencegah latensi tinggi di Cloud Run (502/504)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AliBank-V3-Core/1.1 (Production Node)'
      },
      cache: 'no-store',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Binance Upstream Error:', errorData);
      // Jika error 400 (Invalid Symbol), jangan kembalikan 502, berikan info yang benar
      return NextResponse.json({ 
        error: 'Node bursa memberikan respons negatif.',
        code: response.status 
      }, { status: response.status === 400 ? 400 : 502 });
    }

    const data = await response.json();
    
    // Header anti-cache yang sangat ketat untuk lingkungan Live
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Market Proxy Ticker Exception:', error.message);
    return NextResponse.json(
      { error: 'Hambatan koneksi pada node harga global.' }, 
      { status: 504 }
    );
  }
}
