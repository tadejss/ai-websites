import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidSmsGatewayToken, readBearerToken } from "@/lib/auth";
import { isDatabaseConfigured } from "@/db/client";
import { processInboundSms } from "@/outreach/sms/inbound";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  providerMessageId: z.string().optional().nullable(),
  from: z.string().min(1),
  to: z.string().optional().nullable(),
  body: z.string().min(1),
  receivedAt: z.string().optional().nullable(),
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

  const record = await processInboundSms(parsed.data);
  return NextResponse.json({
    ok: true,
    id: record.id,
    matched: record.matched,
    slug: record.slug,
    isOptOut: record.isOptOut,
  });
}
