import { logAdminAction } from "@/admin/audit";
import { NextResponse } from "next/server";
import { getCustomerBySlug } from "@/customers/store";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { dispatchCustomerPublish } from "@/onboarding/dispatch-customer-publish";
import { getOnboardingBySlug } from "@/onboarding/store";
import { canRetryCustomerPublish } from "@/onboarding/types";

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

  if (onboarding.status === "live") {
    return NextResponse.json({
      ok: true,
      status: onboarding.status,
      alreadyLive: true,
    });
  }

  if (!canRetryCustomerPublish(onboarding.status)) {
    return NextResponse.json(
      {
        error: "Onboarding is not in a publish-retryable state",
        status: onboarding.status,
      },
      { status: 409 },
    );
  }

  const dispatch = await dispatchCustomerPublish({
    slug,
    reason: "admin_retry",
  });

  if (!dispatch.ok) {
    await logAdminAction({
      action: "retry_publish",
      slug,
      result: "error",
      detail: { error: dispatch.error },
    });
    return NextResponse.json({ error: dispatch.error }, { status: 502 });
  }

  await logAdminAction({
    action: "retry_publish",
    slug,
    result: "ok",
    detail: { dispatched: dispatch.dispatched },
  });

  return NextResponse.json({
    ok: true,
    status: onboarding.status,
    publishDispatch: dispatch,
  });
}
