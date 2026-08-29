import { NextResponse } from "next/server";
import { isCustomer } from "@/customers/store";
import { verifyOnboardingAccess } from "@/onboarding/auth";
import { buildOnboardingPrefill } from "@/onboarding/prefill";
import {
  processOnboardingSubmission,
  recordApprovalEmailSent,
  shouldSendApprovalEmail,
} from "@/onboarding/process";
import {
  getOnboardingBySlug,
  saveOnboardingDraft,
  submitOnboarding,
} from "@/onboarding/store";
import {
  customerOnboardingAnswersSchema,
  customerOnboardingSubmitSchema,
} from "@/onboarding/types";
import { sendOnboardingApprovalEmail } from "@/billing/notify-onboarding-approval";
import { resolveCheckoutLead } from "@/leads/checkout-lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function readToken(request: Request, body?: { token?: unknown }): string | null {
  const fromQuery = new URL(request.url).searchParams.get("token");
  if (fromQuery?.trim()) {
    return fromQuery.trim();
  }
  if (typeof body?.token === "string" && body.token.trim()) {
    return body.token.trim();
  }
  return null;
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const token = readToken(request);
  const access = await verifyOnboardingAccess(slug, token);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const record = await getOnboardingBySlug(slug);
  const prefill = buildOnboardingPrefill(slug, record);

  return NextResponse.json({
    status: record?.status ?? "pending",
    prefill,
    submittedAt: record?.submittedAt ?? null,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { slug } = await context.params;

  let body: { token?: unknown; answers?: unknown };
  try {
    body = (await request.json()) as { token?: unknown; answers?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const token = readToken(request, body);
  const access = await verifyOnboardingAccess(slug, token);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const parsed = customerOnboardingAnswersSchema.safeParse(body.answers ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid answers", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const record = await saveOnboardingDraft(slug, parsed.data);
  return NextResponse.json({ ok: true, status: record.status });
}

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;

  let body: { token?: unknown; answers?: unknown };
  try {
    body = (await request.json()) as { token?: unknown; answers?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const token = readToken(request, body);
  const access = await verifyOnboardingAccess(slug, token);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  if (!(await isCustomer(slug))) {
    return NextResponse.json({ error: "Not a customer" }, { status: 403 });
  }

  const parsed = customerOnboardingSubmitSchema.safeParse(body.answers ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { onboarding, alreadySubmitted } = await submitOnboarding(
    slug,
    parsed.data,
  );

  if (alreadySubmitted) {
    return NextResponse.json({
      ok: true,
      status: onboarding.status,
      alreadySubmitted: true,
    });
  }

  const processed = await processOnboardingSubmission(slug);

  if (
    !processed.alreadyProcessed &&
    (await shouldSendApprovalEmail(slug))
  ) {
    const lead = resolveCheckoutLead(slug);
    const approval = await sendOnboardingApprovalEmail({
      slug,
      companyName: lead.companyName?.trim() || slug,
      contactEmail: onboarding.contactEmail ?? parsed.data.email,
      answers: parsed.data,
    });

    if (!approval.ok) {
      console.error("[onboarding] Approval email failed:", approval.error);
    } else {
      await recordApprovalEmailSent(slug);
    }
  }

  const finalRecord = await getOnboardingBySlug(slug);

  return NextResponse.json({
    ok: true,
    status: finalRecord?.status ?? processed.onboarding.status,
    alreadySubmitted: false,
  });
}
