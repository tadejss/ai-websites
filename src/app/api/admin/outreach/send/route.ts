import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidAdminToken, readBearerToken } from "@/lib/auth";
import { isOutreachConfigured } from "@/outreach/config";
import type { OutreachStep } from "@/leads/outreach-types";
import { sendOutreachToLead } from "@/outreach/send";
import { ADMIN_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";
import { logAdminAction } from "@/admin/audit";
import { afterAdminMutation } from "@/admin/revalidate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z.string().min(1),
  step: z.enum(["initial", "followup_1", "followup_2"]).optional(),
  force: z.boolean().optional(),
});

async function isAuthorized(request: Request): Promise<boolean> {
  const bearer = readBearerToken(request.headers.get("authorization"));

  if (isValidAdminToken(bearer)) {
    return true;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE)?.value;

  return isValidAdminToken(session);
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isOutreachConfigured()) {
    return NextResponse.json(
      { error: "Outreach is not configured. Set RESEND_API_KEY and OUTREACH_FROM_EMAIL, or enable OUTREACH_DRY_RUN." },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = await sendOutreachToLead(parsed.data.slug, {
    step: parsed.data.step as OutreachStep | undefined,
    force: parsed.data.force,
  });

  if (!result.ok) {
    await logAdminAction({
      action: "email_send",
      slug: parsed.data.slug,
      result: "error",
      detail: { skipped: result.skipped },
    });
    return NextResponse.json(result, { status: result.skipped ? 409 : 500 });
  }

  await logAdminAction({
    action: "email_send",
    slug: parsed.data.slug,
    result: "ok",
  });
  await afterAdminMutation();

  return NextResponse.json(result);
}
