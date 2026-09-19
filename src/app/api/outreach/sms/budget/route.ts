import { NextResponse } from "next/server";
import { isValidSmsGatewayToken, readBearerToken } from "@/lib/auth";
import { isDatabaseConfigured } from "@/db/client";
import {
  getDailySmsCapacity,
  type SmsDailyBudgetSnapshot,
} from "@/outreach/sms/daily-budget";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUDGET_CACHE_TTL_MS = 45_000;
let budgetCache: { expiresAt: number; value: SmsDailyBudgetSnapshot } | null =
  null;

/** Durable daily budget snapshot for the local gateway. */
export async function GET(request: Request) {
  const token = readBearerToken(request.headers.get("authorization"));
  if (!isValidSmsGatewayToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const now = Date.now();
  if (budgetCache && budgetCache.expiresAt > now) {
    return NextResponse.json({
      ok: true,
      ...budgetCache.value,
      cached: true,
    });
  }

  const capacity = await getDailySmsCapacity({ source: "gateway_budget_api" });
  budgetCache = {
    expiresAt: now + BUDGET_CACHE_TTL_MS,
    value: capacity,
  };
  return NextResponse.json({
    ok: true,
    ...capacity,
  });
}
