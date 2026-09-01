import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  isValidAdminToken,
  readBearerToken,
} from "@/lib/auth";
import { isDatabaseConfigured } from "@/db/client";
import { readLead } from "@/leads/store";
import { getSmsMessageById } from "@/outreach/sms/store";
import { enqueueSmsForLead } from "@/outreach/sms/queue";
import type { SmsStep } from "@/outreach/sms/types";
import { logAdminAction } from "@/admin/audit";
import { afterAdminMutation } from "@/admin/revalidate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  messageId: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  step: z.enum(["initial", "followup_1", "followup_2", "manual"]).optional(),
});

async function isAuthorized(request: Request): Promise<boolean> {
  const bearer = readBearerToken(request.headers.get("authorization"));
  if (isValidAdminToken(bearer)) {
    return true;
  }
  const cookieStore = await cookies();
  return isValidAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
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
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  let slug = parsed.data.slug;
  let step: SmsStep = parsed.data.step ?? "manual";

  if (parsed.data.messageId) {
    const existing = await getSmsMessageById(parsed.data.messageId);
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    if (existing.status !== "failed") {
      return NextResponse.json(
        { error: `Only failed messages can be retried (status=${existing.status})` },
        { status: 409 },
      );
    }
    slug = existing.slug;
    step = existing.step;
  }

  if (!slug) {
    return NextResponse.json({ error: "slug or messageId required" }, { status: 400 });
  }

  const lead = readLead(slug);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const result = await enqueueSmsForLead({ lead, step, force: true });
  if (!result.ok) {
    await logAdminAction({
      action: "sms_retry",
      slug,
      result: "error",
      detail: { error: result.error },
    });
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  await logAdminAction({
    action: "sms_retry",
    slug,
    result: "ok",
    detail: { messageId: result.message.messageId, step },
  });
  await afterAdminMutation();

  return NextResponse.json({
    ok: true,
    messageId: result.message.messageId,
    status: result.message.status,
    step: result.message.step,
  });
}
