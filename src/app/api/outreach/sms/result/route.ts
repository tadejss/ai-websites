import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidSmsGatewayToken, readBearerToken } from "@/lib/auth";
import { isDatabaseConfigured } from "@/db/client";
import { applySmsResult } from "@/outreach/sms/result";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  messageId: z.string().min(1),
  success: z.boolean(),
  providerMessageId: z.string().optional().nullable(),
  error: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const token = readBearerToken(request.headers.get("authorization"));
  if (!isValidSmsGatewayToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const outcome = await applySmsResult(parsed.data);
  if (!outcome) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    alreadyApplied: outcome.alreadyApplied,
    status: outcome.message.status,
    messageId: outcome.message.messageId,
  });
}
