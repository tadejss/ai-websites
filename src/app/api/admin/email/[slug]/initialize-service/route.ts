import { logAdminAction } from "@/admin/audit";
import { afterAdminMutation } from "@/admin/revalidate";
import { NextResponse } from "next/server";
import { authorizeAdminMutation } from "@/lib/admin-auth";
import { getCustomerBySlug } from "@/customers/store";
import { hasProfessionalEmailEntitlement } from "@/email/entitlement";
import { ensureEmailServiceForCustomer } from "@/email/orchestrate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  if (!(await authorizeAdminMutation(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const customer = await getCustomerBySlug(slug);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const entitled = await hasProfessionalEmailEntitlement(slug);
  if (!entitled) {
    return NextResponse.json(
      { error: "Professional email upsell is not purchased" },
      { status: 409 },
    );
  }

  const { service, alreadyExists } = await ensureEmailServiceForCustomer(slug);
  if (!service) {
    return NextResponse.json(
      { error: "Could not initialize email service" },
      { status: 409 },
    );
  }

  await logAdminAction({
    action: "email_initialize_service",
    slug,
    result: "ok",
    detail: { alreadyExists, status: service.status },
  });
  await afterAdminMutation();

  return NextResponse.json({
    ok: true,
    alreadyExists,
    emailService: service,
  });
}
