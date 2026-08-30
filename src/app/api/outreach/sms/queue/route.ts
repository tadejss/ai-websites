import { NextResponse } from "next/server";
import { isValidSmsGatewayToken, readBearerToken } from "@/lib/auth";
import { isDatabaseConfigured } from "@/db/client";
import { claimSmsBatch } from "@/outreach/sms/claim";
import { getSmsConfig } from "@/outreach/sms/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = readBearerToken(request.headers.get("authorization"));
  if (!isValidSmsGatewayToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const requested = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
  const config = getSmsConfig();
  const limit = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, config.batchSize)
    : config.batchSize;

  const messages = await claimSmsBatch({
    limit,
    claimedBy: "gateway",
  });

  return NextResponse.json({ messages });
}
