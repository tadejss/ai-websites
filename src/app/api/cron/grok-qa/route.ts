import { NextResponse } from "next/server";
import { isValidCronToken, readBearerToken } from "@/lib/auth";
import { isDatabaseConfigured } from "@/db/client";
import { processQaBatch } from "@/qa/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = readBearerToken(request.headers.get("authorization"));
  if (!isValidCronToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const result = await processQaBatch({ workerId: "cron-grok-qa" });
  return NextResponse.json({ ok: true, channel: "grok-qa", ...result });
}

export async function POST(request: Request) {
  return GET(request);
}
