import type Stripe from "stripe";
import { getStripe } from "./stripe";
import {
  verifyBaseCheckoutSession,
  verifyUpsellCheckoutSession,
  type UpsellType,
  type VerifiedBaseCheckout,
} from "./upsells";
import { recordUpsellPurchase } from "@/leads/upsell-store";

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

/** If user just returned from upsell Stripe Checkout, confirm payment server-side. */
export async function confirmUpsellReturn(
  upsellSessionId: string | undefined,
  slug: string,
  originalSessionId: string,
): Promise<UpsellType | null> {
  if (!upsellSessionId?.startsWith("cs_")) {
    return null;
  }

  const session = await retrieveCheckoutSession(upsellSessionId);
  if (!session) {
    return null;
  }

  const verified = verifyUpsellCheckoutSession(
    session,
    slug,
    originalSessionId,
  );
  return verified?.upsellType ?? null;
}

/** Sync upsell purchases from Stripe when user returns before webhook fires. */
export async function syncUpsellsForBaseSession(
  customerId: string,
  slug: string,
  originalSessionId: string,
): Promise<void> {
  const stripe = getStripe();
  const sessions = await stripe.checkout.sessions.list({
    customer: customerId,
    limit: 20,
  });

  for (const session of sessions.data) {
    if (session.payment_status !== "paid") {
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

    recordUpsellPurchase(slug, verified.upsellType, session.id);
  }
}
