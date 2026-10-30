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

/** Harga anchor ALX dalam USD (dipakai sebagai fallback bila likuiditas belum termuat) */
export const ALX_PRICE_USD_FALLBACK = 12.24;

/**
 * Kurs cadangan mata uang asing: jumlah mata uang per 1 USD.
 * Hanya dipakai jika API /api/forex/rate gagal mengembalikan `rates`.
 * Mata uang di luar tabel ini TIDAK boleh ditebak (jangan diperlakukan sebagai USD).
 */
export const FIAT_PER_USD_FALLBACK: Record<string, number> = {
  EUR: 0.93, GBP: 0.79, SGD: 1.35, AUD: 1.54, JPY: 151.5, MYR: 4.7,
  CNY: 7.2, KRW: 1350, INR: 83.5, THB: 36, VND: 25000, PHP: 56,
  HKD: 7.8, CAD: 1.36, CHF: 0.9, SAR: 3.75, AED: 3.67, NZD: 1.65,
  TWD: 32, BRL: 5.1, TRY: 32, RUB: 92, ZAR: 18.5, MXN: 17,
};

/** Konversi nominal mata uang apa pun ke IDR. Mengembalikan 0 bila kurs tidak tersedia. */
export function fiatToIdrRate(
  code: string,
  idrPerUsd: number,
  perUsdRates?: Record<string, number> | null
): number {
  if (code === 'IDR') return 1;
  if (code === 'USD') return idrPerUsd;
  const perUsd = perUsdRates?.[code] ?? FIAT_PER_USD_FALLBACK[code];
  if (!perUsd || perUsd <= 0 || !isFinite(perUsd)) return 0;
  return idrPerUsd / perUsd;
}

/** Pembulatan ke bawah untuk jumlah kripto yang DITERIMA nasabah (tidak pernah melebihi nilai bayar). */
export function floorCrypto(value: number, decimals = 8): number {
  if (!isFinite(value) || value <= 0) return 0;
  const f = Math.pow(10, decimals);
  return Math.floor(value * f + 1e-9) / f;
}

/** Pembulatan ke atas untuk jumlah kripto yang DIJUAL nasabah (tidak pernah kurang dari nilai terima). */
export function ceilCrypto(value: number, decimals = 8): number {
  if (!isFinite(value) || value <= 0) return 0;
  const f = Math.pow(10, decimals);
  return Math.ceil(value * f - 1e-9) / f;
}

/** Format jumlah kripto tanpa notasi ilmiah dan tanpa nol berlebih di belakang. */
export function formatCryptoAmount(value: number, decimals = 8): string {
  if (!isFinite(value) || value <= 0) return '0';
  const s = value.toFixed(decimals);
  const trimmed = s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
  return trimmed === '' ? '0' : trimmed;
}

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
