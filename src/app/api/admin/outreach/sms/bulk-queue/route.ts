import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/admin/audit";
import { afterAdminMutation } from "@/admin/revalidate";
import { readLead } from "@/leads/store";
import { enqueueSmsForLead } from "@/outreach/sms/queue";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slugs: z.array(z.string().min(1)).min(1).max(50),
  step: z.enum(["initial", "followup_1", "followup_2"]).optional(),
});

export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const step = parsed.data.step ?? "initial";
  const results: Array<{ slug: string; ok: boolean; error?: string }> = [];

  for (const slug of parsed.data.slugs) {
    const lead = readLead(slug);
    if (!lead) {
      results.push({ slug, ok: false, error: "Lead not found" });
      continue;
    }

    const result = await enqueueSmsForLead({ lead, step });
    if (result.ok) {
      results.push({ slug, ok: true });
    } else {
      results.push({ slug, ok: false, error: result.error });
    }
  }

  const queued = results.filter((result) => result.ok).length;

  await logAdminAction({
    action: "bulk_sms_queue",
    result: queued > 0 ? "ok" : "error",
    detail: { step, queued, total: parsed.data.slugs.length },
  });
  await afterAdminMutation();

  return NextResponse.json({ ok: true, queued, results });
}
