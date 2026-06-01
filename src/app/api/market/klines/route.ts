import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FALLBACKS: Record<string, { price: number; change: number }> = {
  "BTC": { price: 73500, change: -0.45 },
  "ETH": { price: 2000, change: 3.73 },
  "BNB": { price: 575.2, change: -1.2 },
  "SOL": { price: 145.5, change: 2.5 },
  "XRP": { price: 0.52, change: 0.85 },
  "ADA": { price: 0.45, change: -1.1 },
  "DOGE": { price: 0.14, change: 4.2 },
  "TRX": { price: 0.12, change: 0.3 },
  "DOT": { price: 6.5, change: -2.4 },
  "LINK": { price: 15.2, change: 1.8 },
  "MATIC": { price: 0.68, change: -0.95 },
  "LTC": { price: 82.4, change: 1.15 },
  "SHIB": { price: 0.000022, change: 5.4 },
  "AVAX": { price: 34.8, change: -1.5 },
  "UNI": { price: 7.2, change: 0.9 },
  "ATOM": { price: 8.4, change: -2.1 },
  "XLM": { price: 0.11, change: 0.25 },
  "XMR": { price: 172.5, change: 0.6 },
  "NEAR": { price: 5.8, change: 3.1 },
  "ARB": { price: 0.95, change: -1.8 },
  "USDT": { price: 1.0, change: 0.0 },
};

function getCoinNameAndQuote(binanceSymbol: string) {
  const upper = binanceSymbol.toUpperCase();
  if (upper === 'USDTIDRT' || upper === 'USDTIDR' || upper === 'USDT') {
    return { fsym: 'USDT', tsym: 'IDR' };
  }
  if (upper.endsWith('USDT')) {
    return { fsym: upper.replace('USDT', ''), tsym: 'USD' };
  }
  if (upper.endsWith('IDR')) {
    return { fsym: upper.replace('IDR', ''), tsym: 'IDR' };
  }
  return { fsym: upper, tsym: 'USD' };
}

function getIntervalMapping(interval: string) {
  let endpoint = "histominute";
  let aggregate = 1;
  
  if (interval === "1m") {
    endpoint = "histominute";
    aggregate = 1;
  } else if (interval === "5m") {
    endpoint = "histominute";
    aggregate = 5;
  } else if (interval === "15m") {
    endpoint = "histominute";
    aggregate = 15;
  } else if (interval === "1j" || interval === "1h") {
    endpoint = "histohour";
    aggregate = 1;
  } else if (interval === "4j" || interval === "4h") {
    endpoint = "histohour";
    aggregate = 4;
  } else if (interval === "1d" || interval === "1H" || interval === "1D") {
    endpoint = "histoday";
    aggregate = 1;
  }
  return { endpoint, aggregate };
}

function generateSimulatedKlines(basePrice: number, limit: number = 60) {
  const klines = [];
  let currentPrice = basePrice;
  const now = Date.now();
  const timeStep = 60 * 1000; 
  
  for (let i = limit - 1; i >= 0; i--) {
    const time = now - i * timeStep;
    const changePercent = (Math.random() * 0.015 - 0.0075); 
    const open = currentPrice;
    const close = currentPrice * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.004);
    const low = Math.min(open, close) * (1 - Math.random() * 0.004);
    const volume = Math.random() * 500 + 50;
    
    klines.push([
      time,
      open.toString(),
      high.toString(),
      low.toString(),
      close.toString(),
      volume.toString(),
      time + timeStep - 1,
      (volume * currentPrice).toString(),
      Math.floor(volume / 5),
      (volume * 0.6).toString(),
      (volume * currentPrice * 0.6).toString(),
      "0"
    ]);
    currentPrice = close;
  }
  return klines;
}

async function fetchCryptoCompareKlines(fsym: string, tsym: string, endpoint: string, aggregate: number, limit: number) {
  try {
    const ccUrl = `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${fsym}&tsym=${tsym}&limit=${limit}&aggregate=${aggregate}`;
    const response = await fetch(ccUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      next: { revalidate: 30 }
    });
    if (!response.ok) return null;
    const json = await response.json();
    if (json && json.Response === "Success" && json.Data && Array.isArray(json.Data.Data)) {
      return json.Data.Data.map((item: any) => [
        item.time * 1000,
        item.open.toString(),
        item.high.toString(),
        item.low.toString(),
        item.close.toString(),
        item.volumefrom.toString(),
        (item.time * 1000) + (aggregate * 60000) - 1,
        item.volumeto.toString(),
        100,
        (item.volumefrom * 0.5).toString(),
        (item.volumeto * 0.5).toString(),
        "0"
      ]);
    }
    return null;
  } catch (err) {
    console.error('CryptoCompare klines fetch error:', err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');
  const limitStr = searchParams.get('limit');

  if (!symbol || !interval) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const limit = parseInt(limitStr || '60');
  const sanitizedSymbol = symbol === 'USDTIDR' ? 'USDTIDRT' : symbol;
  const url = `https://api.binance.com/api/v3/klines?symbol=${sanitizedSymbol}&interval=${interval}&limit=${limit}`;

  const { fsym, tsym } = getCoinNameAndQuote(symbol);
  let fallbackVal = FALLBACKS[fsym];
  if (!fallbackVal) {
    fallbackVal = { price: 1.0, change: 0.0 };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); 

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AliBank-V3-Core/1.1'
      },
      next: { revalidate: 30 },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) {
      throw new Error('Binance klines blocked or busy');
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, max-age=30',
        }
      });
    }
    throw new Error('Invalid payload from Binance');
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.warn('[Klines Binance Failure, using CryptoCompare fallback]:', error.message);

    const { endpoint, aggregate } = getIntervalMapping(interval);
    const ccData = await fetchCryptoCompareKlines(fsym, tsym, endpoint, aggregate, limit);
    if (ccData && ccData.length > 0) {
      return NextResponse.json(ccData, {
        headers: { 'Cache-Control': 'public, max-age=30' }
      });
    }

    console.warn('[Klines CryptoCompare Failure, using Simulated Mock Klines]');
    const simulated = generateSimulatedKlines(fallbackVal.price, limit);
    return NextResponse.json(simulated, {
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}

