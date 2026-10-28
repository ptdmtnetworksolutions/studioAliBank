import { NextRequest, NextResponse } from "next/server";
import { getClientIpFromHeaders, isPrivateIp, isTorExitNode } from "@/lib/tor";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = getClientIpFromHeaders(req.headers);
  const isPrivate = isPrivateIp(ip);
  const isTor = await isTorExitNode(ip);
  const isBypassed = req.cookies.get("alibank_tor_bypass")?.value === "true";

  return NextResponse.json({
    clientIp: ip,
    isTor: isTor,
    isPrivate: isPrivate,
    torEnforced: process.env.NEXT_PUBLIC_REQUIRE_TOR !== "false",
    isBypassed: isBypassed,
    timestamp: Date.now()
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    const res = NextResponse.json({ success: true, action });

    if (action === "bypass") {
      // Set cookie for 7 days
      res.cookies.set("alibank_tor_bypass", "true", {
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
        httpOnly: false,
        sameSite: "lax"
      });
    } else if (action === "enforce") {
      // Clear bypass cookie to re-test Tor blocking
      res.cookies.delete("alibank_tor_bypass");
    }

    return res;
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
