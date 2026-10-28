import { NextRequest, NextResponse } from "next/server";
import { getClientIpFromHeaders, isPrivateIp, isTorExitNode } from "@/lib/tor";

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 1. Bypass static assets, internal paths, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/tor-required" ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/manifest.webmanifest" ||
    /\.(ico|png|jpg|jpeg|svg|webp|css|js|json|woff|woff2|ttf|otf)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Check environment variable toggle (if set to false, skip Tor enforcement)
  if (process.env.NEXT_PUBLIC_REQUIRE_TOR === "false") {
    return NextResponse.next();
  }

  // 3. Extract visitor IP
  const clientIp = getClientIpFromHeaders(req.headers);
  const isPrivate = isPrivateIp(clientIp);

  // 4. Force simulation block if ?simulate_block=1 is present
  if (searchParams.get("simulate_block") === "1") {
    return NextResponse.redirect(new URL("/tor-required", req.url));
  }

  // 5. Allow local development (127.0.0.1, private LAN) so developers don't get locked out locally
  if (process.env.NODE_ENV === "development" && isPrivate) {
    return NextResponse.next();
  }

  // 6. Verify against official Tor Exit Nodes
  const isTor = await isTorExitNode(clientIp);

  if (isTor) {
    // Verified Tor user - grant access
    const response = NextResponse.next();
    response.headers.set("x-tor-verified", "true");
    return response;
  }

  // Non-Tor user on public clearnet - redirect to Tor Required page
  return NextResponse.redirect(new URL("/tor-required", req.url));
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
