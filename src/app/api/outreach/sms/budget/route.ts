import { NextResponse } from "next/server";
import { isValidSmsGatewayToken, readBearerToken } from "@/lib/auth";
import { isDatabaseConfigured } from "@/db/client";
import { getDailySmsCapacity } from "@/outreach/sms/daily-budget";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Durable daily budget snapshot for the local gateway. */
export async function GET(request: Request) {
  const token = readBearerToken(request.headers.get("authorization"));
  if (!isValidSmsGatewayToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const capacity = await getDailySmsCapacity({ source: "gateway_budget_api" });
  return NextResponse.json({
    ok: true,
    ...capacity,
  });
}
