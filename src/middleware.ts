import { NextRequest, NextResponse } from "next/server";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=(self), payment=(self)",
  "X-XSS-Protection": "1; mode=block",
};

function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

const SAML_SSO_PATH_REGEX = /^\/(saml|sso|adfs|idp|shibboleth|FederationMetadata)(\/|$)/i;
const LEGACY_PROBE_PATH_REGEX =
  /^\/(\.env|\.git|\.svn|\.hg|\.DS_Store|wp-login\.php|wp-admin|wp-content|xmlrpc\.php|phpmyadmin|pma|cgi-bin|actuator|server-status|phpinfo\.php|vendor\/phpunit)(\/|$)/i;
const SAML_XXE_PARAM_REGEX = /(\bSAMLRequest\b|\bSAMLResponse\b|\bRelayState\b|<!\s*(ENTITY|DOCTYPE)\b)/i;
const WAF_INJECTION_REGEX =
  /(\bunion\s+(all\s+)?select\b|\b(sleep|benchmark)\s*\(|\bwaitfor\s+delay\b|<script[\s>]|on(error|load|mouseover|focus)\s*=|\{\{.*\}\}|\.\.\/|\.\.\\|\/etc\/passwd)/i;

const STRICT_RATE_LIMIT_PREFIXES = [
  "/api/auth",
  "/api/transfer",
  "/api/crypto/withdraw",
  "/api/crypto/claim-rewards",
  "/api/games/moba/claim",
  "/api/payments/softpos",
  "/api/payments/nfc-pos",
  "/api/payments/finalize-checkout",
  "/api/users/lookup",
];

const RATE_WINDOW_MS = 60_000;
const STRICT_LIMIT = 10;
const GENERAL_API_LIMIT = 120;
const rateBuckets = new Map<string, { timestamps: number[] }>();

function checkIpRateLimit(
  key: string,
  limit: number
): { allowed: boolean; remaining: number; resetSec: number; retryAfter: number } {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  let bucket = rateBuckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
  }
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] || now;
    const retryAfter = Math.max(1, Math.ceil((oldest + RATE_WINDOW_MS - now) / 1000));
    rateBuckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      resetSec: retryAfter,
      retryAfter,
    };
  }

  bucket.timestamps.push(now);
  rateBuckets.set(key, bucket);

  if (rateBuckets.size > 10_000) {
    for (const [k, b] of rateBuckets.entries()) {
      if (b.timestamps.length === 0 || b.timestamps[b.timestamps.length - 1] <= cutoff) {
        rateBuckets.delete(k);
      }
    }
  }

  const oldest = bucket.timestamps[0] || now;
  return {
    allowed: true,
    remaining: Math.max(0, limit - bucket.timestamps.length),
    resetSec: Math.max(1, Math.ceil((oldest + RATE_WINDOW_MS - now) / 1000)),
    retryAfter: 0,
  };
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const { pathname, search, searchParams } = req.nextUrl;

  // 0. Enforce Canonical Domain: Alihkan alibank-alix.vercel.app ke alibank.tarroz.com
  if (
    host.includes("vercel.app") &&
    !host.includes("localhost")
  ) {
    const canonicalUrl = new URL(pathname + search, "https://alibank.tarroz.com");
    return NextResponse.redirect(canonicalUrl, 301);
  }

  // 1. Block non-existent SAML/SSO & legacy CMS / sensitive file probes cleanly
  if (SAML_SSO_PATH_REGEX.test(pathname) || LEGACY_PROBE_PATH_REGEX.test(pathname)) {
    return applySecurityHeaders(NextResponse.json({ error: "Not found" }, { status: 404 }));
  }

  // 2. Reject SAML / XXE parameters & common SQLi/XSS/SSTI/LFI probes
  let decodedQuery = search;
  try {
    decodedQuery = decodeURIComponent(search);
  } catch {
    return applySecurityHeaders(NextResponse.json({ error: "Malformed query encoding" }, { status: 400 }));
  }
  const inspectTarget = `${pathname}${decodedQuery}`;
  if (SAML_XXE_PARAM_REGEX.test(inspectTarget) || WAF_INJECTION_REGEX.test(decodedQuery) || pathname.includes("..")) {
    return applySecurityHeaders(NextResponse.json({ error: "Request blocked by security policy" }, { status: 400 }));
  }

  // 3. Two-tier sliding-window IP rate limiting on /api/*
  if (pathname.startsWith("/api")) {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const isStrict = STRICT_RATE_LIMIT_PREFIXES.some((p) => pathname.startsWith(p));
    const limit = isStrict ? STRICT_LIMIT : GENERAL_API_LIMIT;
    const tierKey = `${isStrict ? "strict" : "api"}:${clientIp}:${isStrict ? pathname : "all"}`;
    const rl = checkIpRateLimit(tierKey, limit);

    if (!rl.allowed) {
      const blockedRes = NextResponse.json(
        { error: "Terlalu banyak permintaan dari IP Anda. Silakan tunggu sebentar." },
        { status: 429 }
      );
      blockedRes.headers.set("Retry-After", String(rl.retryAfter));
      blockedRes.headers.set("X-RateLimit-Limit", String(limit));
      blockedRes.headers.set("X-RateLimit-Remaining", "0");
      blockedRes.headers.set("X-RateLimit-Reset", String(rl.resetSec));
      return applySecurityHeaders(blockedRes);
    }

    const apiRes = NextResponse.next();
    apiRes.headers.set("X-RateLimit-Limit", String(limit));
    apiRes.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    apiRes.headers.set("X-RateLimit-Reset", String(rl.resetSec));
    return applySecurityHeaders(apiRes);
  }

  // 4. Bypass static assets cleanly with security headers
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/manifest.webmanifest" ||
    /\.(ico|png|jpg|jpeg|svg|webp|css|js|json|woff|woff2|ttf|otf)$/i.test(pathname)
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  // 5. Jika pengunjung membuka halaman /tor-required secara langsung (atau dari cache lama), arahkan langsung ke beranda
  if (pathname === "/tor-required" && searchParams.get("simulate_block") !== "1") {
    return applySecurityHeaders(NextResponse.redirect(new URL("/", req.url)));
  }

  // 6. Allow native Android app via User-Agent
  const userAgent = req.headers.get("user-agent") || "";
  const isNativeApp = userAgent.includes("AliBank-Android") || req.headers.get("x-requested-with") === "com.alibank.pos";

  // 7. Khusus rute private mobile (/m/home): Jika user belum login, arahkan ke /login
  if (pathname === "/m/home") {
    const hasSession = req.cookies.has("alibank_session");
    if (!hasSession) {
      return applySecurityHeaders(NextResponse.redirect(new URL("/login", req.url)));
    }
  }

  // 8. Izinkan akses penuh dari seluruh browser (Chrome, Safari, Firefox, Edge, Brave, Tor, Mobile)
  const response = NextResponse.next();
  if (isNativeApp) {
    response.headers.set("x-native-app", "true");
  }
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
