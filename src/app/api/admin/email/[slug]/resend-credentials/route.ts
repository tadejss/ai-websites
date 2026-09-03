import { logAdminAction } from "@/admin/audit";
import { afterAdminMutation } from "@/admin/revalidate";
import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { resendMailboxCredentials } from "@/email/provision-worker";

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
  const result = await resendMailboxCredentials(slug);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  await logAdminAction({
    action: "email_resend_credentials",
    slug,
    result: "ok",
  });
  await afterAdminMutation();

  return NextResponse.json({ ok: true });
}
