import { NextRequest, NextResponse } from "next/server";
import { getClientIpFromHeaders, isPrivateIp, isTorExitNode } from "@/lib/tor";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = getClientIpFromHeaders(req.headers);
  const isPrivate = isPrivateIp(ip);
  const isTor = await isTorExitNode(ip);

  return NextResponse.json({
    clientIp: ip,
    isTor: isTor,
    isPrivate: isPrivate,
    torEnforced: process.env.NEXT_PUBLIC_REQUIRE_TOR !== "false",
    timestamp: Date.now()
  });
}
