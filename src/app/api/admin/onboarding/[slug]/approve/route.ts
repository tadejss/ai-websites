import { NextResponse } from "next/server";
import { getCustomerBySlug } from "@/customers/store";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { resolveCheckoutLead } from "@/leads/checkout-lead";
import { sendOnboardingPublishApprovedEmail } from "@/billing/notify-onboarding-approved";
import { dispatchCustomerPublish } from "@/onboarding/dispatch-customer-publish";
import {
  approveOnboardingForPublish,
  getOnboardingBySlug,
  markAdminPublishNotifySent,
  shouldSendAdminPublishNotify,
} from "@/onboarding/store";
import { canAdminApproveOnboarding } from "@/onboarding/types";

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

  const customer = await getCustomerBySlug(slug);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const onboarding = await getOnboardingBySlug(slug);
  if (!onboarding) {
    return NextResponse.json({ error: "Onboarding not found" }, { status: 404 });
  }

  if (
    onboarding.status !== "approved_for_publish" &&
    !canAdminApproveOnboarding(onboarding.status)
  ) {
    return NextResponse.json(
      {
        error: "Onboarding is not ready for admin approval",
        status: onboarding.status,
      },
      { status: 409 },
    );
  }

  let result;
  try {
    result = await approveOnboardingForPublish(slug);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Approval failed";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  if (
    !result.alreadyApproved &&
    (await shouldSendAdminPublishNotify(slug))
  ) {
    const lead = resolveCheckoutLead(slug);
    const email = await sendOnboardingPublishApprovedEmail({
      slug,
      companyName:
        onboarding.answers?.companyName?.trim() ||
        lead.companyName?.trim() ||
        slug,
      contactEmail:
        onboarding.contactEmail ?? onboarding.answers?.email ?? null,
    });

    if (!email.ok) {
      console.error("[onboarding/approve] Ops email failed:", email.error);
    } else {
      await markAdminPublishNotifySent(slug);
    }
  }

  let dispatch = null;
  if (!result.alreadyApproved) {
    dispatch = await dispatchCustomerPublish({
      slug,
      reason: "admin_approve",
    });
    if (!dispatch.ok) {
      console.error("[onboarding/approve] Publish dispatch failed:", dispatch.error);
    } else if (!dispatch.dispatched) {
      console.warn("[onboarding/approve] Publish not dispatched:", dispatch.reason);
    }
  }

  const refreshed = await getOnboardingBySlug(slug);

  return NextResponse.json({
    ok: true,
    status: refreshed?.status ?? result.onboarding.status,
    alreadyApproved: result.alreadyApproved,
    adminApprovedAt: refreshed?.adminApprovedAt ?? result.onboarding.adminApprovedAt,
    publishDispatch: dispatch,
  });
}
