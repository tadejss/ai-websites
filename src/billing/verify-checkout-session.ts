import type Stripe from "stripe";
import { getStripe } from "./stripe";
import {
  verifyBaseCheckoutSession,
  verifyUpsellCheckoutSession,
  type UpsellType,
  type VerifiedBaseCheckout,
} from "./upsells";
import { recordUpsellPurchase } from "@/leads/upsell-store";

function customerIdFromCheckoutSession(
  session: Stripe.Checkout.Session,
): string | undefined {
  const customer = session.customer;
  if (!customer) {
    return undefined;
  }
  return typeof customer === "string" ? customer : customer.id;
}

export async function retrieveCheckoutSession(
  sessionId: string,
): Promise<Stripe.Checkout.Session | null> {
  if (!sessionId.startsWith("cs_")) {
    return null;
  }

  try {
    const stripe = getStripe();
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return null;
  }
}

export async function verifyBaseCheckout(
  sessionId: string,
  slug: string,
): Promise<VerifiedBaseCheckout | null> {
  const session = await retrieveCheckoutSession(sessionId);
  if (!session) {
    return null;
  }
  return verifyBaseCheckoutSession(session, slug);
}

/**
 * Copy name/address from a completed Checkout Session onto the Customer when
 * missing, so later Checkout Sessions can prefill business/billing fields.
 */
export async function hydrateCustomerFromSession(
  customerId: string,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(customerId);

  if (customer.deleted) {
    return;
  }

  const details = session.customer_details;
  const updates: Stripe.CustomerUpdateParams = {};

  if (!customer.name?.trim() && details?.name?.trim()) {
    updates.name = details.name.trim();
  }

  const address = details?.address;
  const hasCustomerAddress = Boolean(
    customer.address?.line1 ||
      customer.address?.city ||
      customer.address?.postal_code ||
      customer.address?.country,
  );

  if (!hasCustomerAddress && address) {
    updates.address = {
      line1: address.line1 ?? undefined,
      line2: address.line2 ?? undefined,
      city: address.city ?? undefined,
      state: address.state ?? undefined,
      postal_code: address.postal_code ?? undefined,
      country: address.country ?? undefined,
    };
  }

  if (!customer.phone?.trim() && details?.phone?.trim()) {
    updates.phone = details.phone.trim();
  }

  if (Object.keys(updates).length === 0) {
    return;
  }

  await stripe.customers.update(customerId, updates);
}

function isSessionPaid(session: Stripe.Checkout.Session): boolean {
  return (
    session.payment_status === "paid" || session.status === "complete"
  );
}

function paymentOrSubscriptionId(
  session: Stripe.Checkout.Session,
): string | null {
  if (session.mode === "subscription") {
    const subscription = session.subscription;
    if (!subscription) {
      return null;
    }
    return typeof subscription === "string" ? subscription : subscription.id;
  }
  const paymentIntent = session.payment_intent;
  if (!paymentIntent) {
    return null;
  }
  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

/** List paid upsell types for this base session from Stripe (source of truth). */
export async function listPurchasedUpsellTypesFromStripe(
  customerId: string,
  slug: string,
  originalSessionId: string,
): Promise<UpsellType[]> {
  const stripe = getStripe();
  const sessions = await stripe.checkout.sessions.list({
    customer: customerId,
    limit: 30,
  });

  const types: UpsellType[] = [];

  for (const session of sessions.data) {
    if (!isSessionPaid(session)) {
      continue;
    }

    const verified = verifyUpsellCheckoutSession(
      session,
      slug,
      originalSessionId,
    );
    if (!verified) {
      continue;
    }

    if (!types.includes(verified.upsellType)) {
      types.push(verified.upsellType);
    }
  }

  return types;
}

/**
 * Sync Stripe-paid upsells into the persistent customer store when possible.
 * Never throws — Stripe remains a recovery source of truth.
 */
export async function syncUpsellsForBaseSession(
  customerId: string,
  slug: string,
  originalSessionId: string,
): Promise<UpsellType[]> {
  const stripe = getStripe();
  const sessions = await stripe.checkout.sessions.list({
    customer: customerId,
    limit: 30,
  });

  const types: UpsellType[] = [];

  for (const session of sessions.data) {
    if (!isSessionPaid(session)) {
      continue;
    }

    const verified = verifyUpsellCheckoutSession(
      session,
      slug,
      originalSessionId,
    );
    if (!verified) {
      continue;
    }

    if (!types.includes(verified.upsellType)) {
      types.push(verified.upsellType);
    }

    try {
      await recordUpsellPurchase(
        slug,
        verified.upsellType,
        session.id,
        customerId,
        paymentOrSubscriptionId(session),
      );
    } catch (error) {
      console.warn(
        "[upsell-sync] persist skipped:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return types;
}

/** Confirm a specific upsell Checkout Session after Stripe redirect. */
export async function confirmUpsellReturn(
  upsellSessionId: string | undefined,
  slug: string,
  originalSessionId: string,
): Promise<UpsellType | null> {
  if (!upsellSessionId?.startsWith("cs_")) {
    return null;
  }

  const session = await retrieveCheckoutSession(upsellSessionId);
  if (!session || !isSessionPaid(session)) {
    return null;
  }

  const verified = verifyUpsellCheckoutSession(
    session,
    slug,
    originalSessionId,
  );
  if (!verified) {
    return null;
  }

  const stripeCustomerId =
    customerIdFromCheckoutSession(session) ||
    session.metadata?.original_customer_id?.trim() ||
    undefined;

  try {
    await recordUpsellPurchase(
      slug,
      verified.upsellType,
      session.id,
      stripeCustomerId,
      paymentOrSubscriptionId(session),
    );
  } catch (error) {
    console.warn(
      "[upsell-confirm] persist skipped:",
      error instanceof Error ? error.message : error,
    );
  }

  return verified.upsellType;
}
