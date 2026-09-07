import { NextResponse } from "next/server";
import { isValidCronToken, readBearerToken } from "@/lib/auth";
import { isDatabaseConfigured } from "@/db/client";
import { enqueueDueSmsBatch } from "@/outreach/sms/enqueue-batch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = readBearerToken(request.headers.get("authorization"));
  if (!isValidCronToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.SMS_CRON_ENQUEUE_DISABLED?.trim() === "true") {
    return NextResponse.json({
      ok: true,
      channel: "sms",
      skipped: true,
      reason: "SMS_CRON_ENQUEUE_DISABLED",
      considered: 0,
      queued: 0,
      skippedCount: 0,
      errors: [],
    });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const result = await enqueueDueSmsBatch();
  return NextResponse.json({ ok: true, channel: "sms", ...result });
}

export async function POST(request: Request) {
  return GET(request);
}
