import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sendCheckoutNotification } from "@/billing/notify";
import { sendUpsellNotification } from "@/billing/notify-upsell";
import {
  getStripe,
  isCheckoutPlan,
  type CheckoutPlan,
} from "@/billing/stripe";
import { isUpsellType } from "@/billing/upsells";
import { resolveCheckoutLead } from "@/leads/checkout-lead";
import { recordUpsellPurchase, hasRecordedUpsellSession, hasPurchasedUpsell } from "@/leads/upsell-store";
import { patchLead, readLead } from "@/leads/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function subscriptionIdFromSession(
  session: Stripe.Checkout.Session,
): string | undefined {
  const subscription = session.subscription;

  if (!subscription) {
    return undefined;
  }

  return typeof subscription === "string" ? subscription : subscription.id;
}

function customerIdFromSession(
  session: Stripe.Checkout.Session,
): string | undefined {
  const customer = session.customer;

  if (!customer) {
    return undefined;
  }

  return typeof customer === "string" ? customer : customer.id;
}

async function handleUpsellCompleted(
  session: Stripe.Checkout.Session,
): Promise<{ handled: boolean; slug?: string; upsell?: string; skipped?: boolean }> {
  const upsellTypeRaw = session.metadata?.upsell_type;
  if (!isUpsellType(upsellTypeRaw)) {
    return { handled: false };
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return { handled: false };
  }

  const slug =
    session.metadata?.slug?.trim() ||
    session.client_reference_id?.trim() ||
    "";

  if (!slug) {
    console.error("[stripe-webhook] Missing slug on upsell session", session.id);
    return { handled: false };
  }

  const existingLead = readLead(slug);
  if (
    hasRecordedUpsellSession(existingLead, session.id) ||
    hasPurchasedUpsell(existingLead, upsellTypeRaw)
  ) {
    return { handled: true, slug, upsell: upsellTypeRaw, skipped: true };
  }

  const lead = recordUpsellPurchase(slug, upsellTypeRaw, session.id);

  const notify = await sendUpsellNotification({
    lead,
    upsellType: upsellTypeRaw,
    sessionId: session.id,
    originalCheckoutSessionId:
      session.metadata?.original_checkout_session_id?.trim(),
  });

  if (!notify.ok) {
    console.error("[stripe-webhook] Upsell notify failed:", notify.error);
  }

  return { handled: true, slug, upsell: upsellTypeRaw };
}

async function handleBaseSubscriptionCompleted(
  session: Stripe.Checkout.Session,
): Promise<{ handled: boolean; slug?: string; skipped?: boolean }> {
  if (session.mode !== "subscription") {
    return { handled: false };
  }

  const slug =
    session.metadata?.slug?.trim() ||
    session.client_reference_id?.trim() ||
    "";

  if (!slug) {
    console.error("[stripe-webhook] Missing slug on checkout session", session.id);
    return { handled: false };
  }

  const planRaw = session.metadata?.plan;
  const plan: CheckoutPlan = isCheckoutPlan(planRaw) ? planRaw : "monthly";
  const stripeCustomerId = customerIdFromSession(session);
  const stripeSubscriptionId = subscriptionIdFromSession(session);

  const existing = readLead(slug);
  const lead = existing ?? resolveCheckoutLead(slug);

  if (
    existing?.status === "customer" &&
    existing.stripeSubscriptionId &&
    existing.stripeSubscriptionId === stripeSubscriptionId
  ) {
    return { handled: true, slug, skipped: true };
  }

  const updated =
    existing &&
    patchLead(slug, {
      status: "customer",
      stripeCustomerId,
      stripeSubscriptionId,
      subscriptionPlan: plan,
    });

  const notify = await sendCheckoutNotification({
    lead: updated ?? lead,
    plan,
    stripeCustomerId,
    stripeSubscriptionId,
    sessionId: session.id,
  });

  if (!notify.ok) {
    console.error("[stripe-webhook] Notify failed:", notify.error);
  }

  return { handled: true, slug };
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<{
  handled: boolean;
  slug?: string;
  skipped?: boolean;
  upsell?: string;
}> {
  if (session.metadata?.upsell_type) {
    return handleUpsellCompleted(session);
  }

  return handleBaseSubscriptionCompleted(session);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid webhook signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const result = await handleCheckoutCompleted(session);
    return NextResponse.json({ ok: true, ...result });
  }

  return NextResponse.json({ ok: true, handled: false, type: event.type });
}
