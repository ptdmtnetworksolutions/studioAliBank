/**
 * AliBank Currency Constants
 * Single source of truth for IDR/USD exchange rate fallback.
 *
 * This fallback is used ONLY when the real-time API call fails.
 * The live rate is fetched from open.er-api.com / frankfurter.app
 * via the /api/forex/rate endpoint.
 *
 * Update this value periodically to match the current market rate.
 * Current rate as of June 2026: 1 USD ≈ Rp17,690
 */
export const IDR_RATE_FALLBACK = 17690;

/** AliBank platform markup (2%) applied to crypto prices */
export const MARKUP = 1.02;

/**
 * Format a number as Indonesian Rupiah (IDR).
 * Uses id-ID locale: period as thousands separator, comma as decimal.
 * @example formatIDR(15539000) → "Rp15.539.000"
 */
export function formatIDR(value: number, decimals = 0): string {
  return `Rp${value.toLocaleString('id-ID', { maximumFractionDigits: decimals })}`;
}

/**
 * Format a number as US Dollar (USD).
 * Uses en-US locale: comma as thousands separator, period as decimal.
 * @example formatUSD(980.39) → "US$980.39"
 */
export function formatUSD(value: number, decimals = 2): string {
  return `US$${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/**
 * Validate that a parsed IDR/USD rate is realistic.
 * IDR rate should always be > 10,000 (currently ~17,690).
 */
export function isValidIdrRate(rate: number): boolean {
  return rate > 10000 && rate < 100000;
}
