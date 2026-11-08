import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 1. Bypass static assets, internal paths, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/manifest.webmanifest" ||
    /\.(ico|png|jpg|jpeg|svg|webp|css|js|json|woff|woff2|ttf|otf)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Jika pengunjung membuka halaman /tor-required secara langsung (atau dari cache lama), arahkan langsung ke beranda
  if (pathname === "/tor-required" && searchParams.get("simulate_block") !== "1") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 3. Allow native Android app via User-Agent
  const userAgent = req.headers.get("user-agent") || "";
  const isNativeApp = userAgent.includes("AliBank-Android") || req.headers.get("x-requested-with") === "com.alibank.pos";

  // 4. Khusus rute private mobile (/m/home): Jika user belum login, arahkan ke /login
  // Catatan: Rute beranda utama ("/") dibiarkan terbuka karena menampilkan Landing Page resmi bagi pengunjung publik/belum login.
  if (pathname === "/m/home") {
    const hasSession = req.cookies.has("alibank_session");
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // 5. Izinkan akses penuh dari seluruh browser (Chrome, Safari, Firefox, Edge, Brave, Tor, Mobile)
  const response = NextResponse.next();
  if (isNativeApp) {
    response.headers.set("x-native-app", "true");
  }
  return response;
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
