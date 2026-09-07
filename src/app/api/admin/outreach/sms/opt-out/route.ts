import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdminMutation } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/db/client";
import {
  ApplyAdminSmsOptOutError,
  applyAdminSmsOptOutForLead,
} from "@/outreach/sms/opt-out-store";
import { logAdminAction } from "@/admin/audit";
import { afterAdminMutation } from "@/admin/revalidate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z.string().min(1),
});

export async function POST(request: Request) {
  if (!(await authorizeAdminMutation(request))) {
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

  try {
    const result = await applyAdminSmsOptOutForLead({
      slug: parsed.data.slug,
      source: "admin",
      reason: "manual",
    });

    await logAdminAction({
      action: "sms_opt_out",
      slug: parsed.data.slug,
      result: "ok",
      detail: {
        phone: result.phone,
        cancelledCount: result.cancelledCount,
      },
    });
    await afterAdminMutation();

    return NextResponse.json({
      ok: true,
      cancelledCount: result.cancelledCount,
      phone: result.phone,
    });
  } catch (err) {
    if (err instanceof ApplyAdminSmsOptOutError) {
      const status = err.code === "lead_not_found" ? 404 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    throw err;
  }
}
