import { NextResponse } from 'next/server';
import { IDR_RATE_FALLBACK } from '@/lib/currency';

export const dynamic = 'force-dynamic';

/**
 * GET /api/forex/rate
 * Returns the real-time USD to IDR exchange rate.
 *
 * Sources tried in order:
 * 1. open.er-api.com (free, no API key, updates every 24h)
 * 2. api.frankfurter.app (free, no API key, ECB data)
 * 3. Hardcoded fallback (IDR_RATE_FALLBACK from @/lib/currency)
 *
 * Response: { rate: number, source: string, timestamp: number }
 */
export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    // Source 1: open.er-api.com — free, updated every 24h, no key needed
    const res1 = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout);

    if (res1.ok) {
      const data = await res1.json();
      const rate = data?.rates?.IDR;
      if (rate && typeof rate === 'number' && rate > 10000) {
        return NextResponse.json(
          { rate, rates: data.rates, source: 'open.er-api.com', timestamp: Date.now() },
          { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
        );
      }
    }
  } catch (err1) {
    clearTimeout(timeout);
    console.warn('[Forex] open.er-api.com failed, trying frankfurter.app');
  }

  // Source 2: frankfurter.app — free, ECB data, no key needed
  const controller2 = new AbortController();
  const timeout2 = setTimeout(() => controller2.abort(), 4000);

  try {
    const res2 = await fetch('https://api.frankfurter.app/latest?from=USD', {
      signal: controller2.signal,
      next: { revalidate: 3600 },
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout2);

    if (res2.ok) {
      const data = await res2.json();
      const rate = data?.rates?.IDR;
      if (rate && typeof rate === 'number' && rate > 10000) {
        return NextResponse.json(
          { rate, rates: data.rates, source: 'frankfurter.app', timestamp: Date.now() },
          { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
        );
      }
    }
  } catch (err2) {
    clearTimeout(timeout2);
    console.warn('[Forex] frankfurter.app failed, using hardcoded fallback');
  }

  // Source 3: Hardcoded fallback
  return NextResponse.json(
    { rate: IDR_RATE_FALLBACK, source: 'fallback', timestamp: Date.now() },
    { headers: { 'Cache-Control': 'public, s-maxage=600' } }
  );
}
