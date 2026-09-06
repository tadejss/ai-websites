import { logAdminAction } from "@/admin/audit";
import { afterAdminMutation } from "@/admin/revalidate";
import { NextResponse } from "next/server";
import { authorizeAdminMutation } from "@/lib/admin-auth";
import { getCustomerBySlug } from "@/customers/store";
import {
  AdminEmailDomainError,
  adminSetEmailDomain,
} from "@/email/orchestrate";
import { normalizeDomain } from "@/email/normalize-domain";
import { isBlockedWebsiteApex } from "@/website-domains/hostname";

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

  let body: { domain?: unknown };
  try {
    body = (await request.json()) as { domain?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawDomain = typeof body.domain === "string" ? body.domain : "";
  const normalized = normalizeDomain(rawDomain);
  if (!normalized) {
    return NextResponse.json(
      { error: "Enter a valid domain, e.g. example.si" },
      { status: 400 },
    );
  }

  if (isBlockedWebsiteApex(normalized)) {
    return NextResponse.json(
      { error: "This host cannot be used as a customer email domain" },
      { status: 400 },
    );
  }

  try {
    const result = await adminSetEmailDomain({
      customerSlug: slug,
      domain: normalized,
    });

    await logAdminAction({
      action: "email_set_domain",
      slug,
      result: "ok",
      detail: { domain: result.domain.domain },
    });
    await afterAdminMutation();

    return NextResponse.json({
      ok: true,
      domain: result.domain,
      emailService: result.emailService,
    });
  } catch (error) {
    if (error instanceof AdminEmailDomainError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}
