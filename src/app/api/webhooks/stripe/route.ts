import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { sendCheckoutNotification } from "@/billing/notify";
import { sendOnboardingCustomerEmail } from "@/billing/notify-onboarding-customer";
import { sendUpsellNotification } from "@/billing/notify-upsell";
import {
  getStripe,
  isCheckoutPlan,
  type CheckoutPlan,
} from "@/billing/stripe";
import { isUpsellType } from "@/billing/upsells";
import {
  recordCustomerUpsellPurchase,
  upsertCustomerFromCheckout,
} from "@/customers/store";
import { CUSTOMER_SLUGS_CACHE_TAG } from "@/customers/slug-cache";
import { markDemoLifecyclePurchased } from "@/demo-lifecycle/store";
import { isDatabaseConfigured } from "@/db/client";
import { resolveCheckoutLead } from "@/leads/checkout-lead";
import {
  ensureOnboardingAccess,
  getOnboardingUrl,
  markWelcomeEmailSent,
} from "@/onboarding/store";

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

function paymentOrSubscriptionId(
  session: Stripe.Checkout.Session,
): string | undefined {
  if (session.mode === "subscription") {
    return subscriptionIdFromSession(session);
  }
  const paymentIntent = session.payment_intent;
  if (!paymentIntent) {
    return undefined;
  }
  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

type HandlerResult = {
  handled: boolean;
  slug?: string;
  skipped?: boolean;
  upsell?: string;
};

function contactEmailFromSession(
  session: Stripe.Checkout.Session,
): string | undefined {
  return (
    session.customer_details?.email?.trim() ||
    session.customer_email?.trim() ||
    undefined
  );
}

function contactNameFromSession(
  session: Stripe.Checkout.Session,
): string | undefined {
  return session.customer_details?.name?.trim() || undefined;
}

async function handleUpsellCompleted(
  session: Stripe.Checkout.Session,
): Promise<HandlerResult> {
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

  const stripeCustomerId =
    customerIdFromSession(session) ||
    session.metadata?.original_customer_id?.trim();

  if (!stripeCustomerId) {
    console.error(
      "[stripe-webhook] Missing customer on upsell session",
      session.id,
    );
    return { handled: false };
  }

  const { customer, alreadyProcessed } = await recordCustomerUpsellPurchase({
    slug,
    upsellType: upsellTypeRaw,
    stripeCustomerId,
    checkoutSessionId: session.id,
    stripeObjectId: paymentOrSubscriptionId(session) ?? null,
  });

  revalidateTag(CUSTOMER_SLUGS_CACHE_TAG, "max");

  if (alreadyProcessed) {
    return {
      handled: true,
      slug,
      upsell: upsellTypeRaw,
      skipped: true,
    };
  }

  const lead = resolveCheckoutLead(slug);
  const notify = await sendUpsellNotification({
    lead: {
      ...lead,
      status: customer.status,
      stripeCustomerId: customer.stripeCustomerId,
    },
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
): Promise<HandlerResult> {
  if (session.mode !== "subscription") {
    return { handled: false };
  }

  // Upsell email is also mode=subscription — routed earlier via metadata.
  if (session.metadata?.upsell_type) {
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

  if (!stripeCustomerId) {
    console.error(
      "[stripe-webhook] Missing customer on checkout session",
      session.id,
    );
    return { handled: false };
  }

  const { customer, alreadyProcessed } = await upsertCustomerFromCheckout({
    slug,
    stripeCustomerId,
    stripeSubscriptionId,
    subscriptionPlan: plan,
    checkoutSessionId: session.id,
  });

  revalidateTag(CUSTOMER_SLUGS_CACHE_TAG, "max");

  const contactEmail = contactEmailFromSession(session);
  const contactName = contactNameFromSession(session);
  const { onboarding } = await ensureOnboardingAccess({
    slug,
    contactEmail,
    contactName,
  });

  if (alreadyProcessed) {
    return { handled: true, slug, skipped: true };
  }

  await markDemoLifecyclePurchased(slug, customer.purchasedAt);

  const onboardingUrl = getOnboardingUrl(slug, onboarding.accessToken);

  if (!onboarding.welcomeEmailSentAt) {
    const lead = resolveCheckoutLead(slug);
    const companyName = lead.companyName?.trim() || slug;

    const notify = await sendCheckoutNotification({
      lead: {
        ...lead,
        status: customer.status,
        stripeCustomerId: customer.stripeCustomerId,
        stripeSubscriptionId: customer.stripeSubscriptionId ?? undefined,
        subscriptionPlan: customer.subscriptionPlan ?? undefined,
      },
      plan,
      stripeCustomerId: customer.stripeCustomerId,
      stripeSubscriptionId: customer.stripeSubscriptionId ?? undefined,
      sessionId: session.id,
      onboardingUrl,
    });

    if (!notify.ok) {
      console.error("[stripe-webhook] Notify failed:", notify.error);
    }

    const recipientEmail = contactEmail || lead.email?.trim();
    if (recipientEmail) {
      const customerEmail = await sendOnboardingCustomerEmail({
        slug,
        accessToken: onboarding.accessToken,
        companyName,
        contactEmail: recipientEmail,
        contactName: contactName ?? onboarding.contactName,
      });

      if (!customerEmail.ok) {
        console.error(
          "[stripe-webhook] Onboarding customer email failed:",
          customerEmail.error,
        );
      }
    }

    await markWelcomeEmailSent(slug);
  }

  return { handled: true, slug };
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<HandlerResult> {
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

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
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
    try {
      const result = await handleCheckoutCompleted(session);
      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Webhook handler failed";
      console.error("[stripe-webhook]", message);
      // Return 500 so Stripe retries until DB write succeeds.
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, handled: false, type: event.type });
}
