import { logAdminAction } from "@/admin/audit";
import { afterAdminMutation } from "@/admin/revalidate";
import { NextResponse } from "next/server";
import { getCustomerBySlug } from "@/customers/store";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getOnboardingBySlug } from "@/onboarding/store";
import { canAdminAttachWebsiteDomain } from "@/onboarding/types";
import { attachWebsiteDomain } from "@/website-domains/attach";
import {
  WebsiteDomainCollisionError,
  WebsiteDomainValidationError,
} from "@/website-domains/types";
import { VercelDomainConfigError } from "@/website-domains/vercel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;

  const customer = await getCustomerBySlug(slug);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const onboarding = await getOnboardingBySlug(slug);
  if (!onboarding) {
    return NextResponse.json({ error: "Onboarding not found" }, { status: 404 });
  }

  if (!canAdminAttachWebsiteDomain(onboarding.status)) {
    return NextResponse.json(
      {
        error: "Approve onboarding before connecting a custom domain.",
        status: onboarding.status,
      },
      { status: 409 },
    );
  }

  let hostname = "";
  try {
    const body = (await request.json()) as { hostname?: unknown };
    hostname = typeof body.hostname === "string" ? body.hostname : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await attachWebsiteDomain({
      customerSlug: slug,
      hostname,
    });

    await logAdminAction({
      action: "website_domain_attach",
      slug,
      result: result.error ? "error" : "ok",
      detail: {
        hostname,
        statuses: result.domains.map((domain) => ({
          hostname: domain.hostname,
          status: domain.status,
        })),
      },
    });
    await afterAdminMutation(slug);

    if (
      result.error === "Vercel is not configured for custom domains."
    ) {
      return NextResponse.json(
        { error: result.error, domains: result.domains },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: !result.error,
      domains: result.domains,
      error: result.error,
    });
  } catch (error) {
    await logAdminAction({
      action: "website_domain_attach",
      slug,
      result: "error",
      detail: { hostname },
    });

    if (error instanceof WebsiteDomainValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof WebsiteDomainCollisionError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof VercelDomainConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      { error: "Could not connect the domain." },
      { status: 500 },
    );
  }
}
