import { logAdminAction } from "@/admin/audit";
import { afterAdminMutation } from "@/admin/revalidate";
import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getEmailServiceBySlug, resetEmailServiceForRetry } from "@/email/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthorized(_request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const existing = await getEmailServiceBySlug(slug);

  if (!existing) {
    return NextResponse.json({ error: "Email service not found" }, { status: 404 });
  }

  const service = await resetEmailServiceForRetry(slug);
  if (!service) {
    return NextResponse.json(
      { error: "Email service is not in a retryable state", status: existing.status },
      { status: 409 },
    );
  }

  await logAdminAction({
    action: "email_retry_provision",
    slug,
    result: "ok",
  });
  await afterAdminMutation();

  return NextResponse.json({ ok: true, service });
}
