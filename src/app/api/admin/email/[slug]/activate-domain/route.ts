import { logAdminAction } from "@/admin/audit";
import { afterAdminMutation } from "@/admin/revalidate";
import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import {
  activateCustomerDomain,
  transitionEmailServiceAfterDomainActivation,
} from "@/email/store";

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
  const domain = await activateCustomerDomain(slug);

  if (!domain) {
    return NextResponse.json(
      { error: "No pending domain found for customer" },
      { status: 409 },
    );
  }

  const service = await transitionEmailServiceAfterDomainActivation(slug);

  await logAdminAction({
    action: "email_activate_domain",
    slug,
    result: "ok",
    detail: { domain: domain.domain },
  });
  await afterAdminMutation();

  return NextResponse.json({
    ok: true,
    domain,
    emailService: service,
  });
}
