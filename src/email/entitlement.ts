import { hasUpsellPurchase } from "@/customers/store";
import { getUpsellPriceId } from "@/billing/upsells";
import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";

export async function hasProfessionalEmailEntitlement(
  customerSlug: string,
): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false;
  }
  return hasUpsellPurchase(customerSlug, "professional_email");
}

export async function getProfessionalEmailPurchase(
  customerSlug: string,
): Promise<{
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
} | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT stripe_object_id
    FROM customer_purchases
    WHERE slug = ${customerSlug}
      AND upsell_type = 'professional_email'
    ORDER BY purchased_at DESC
    LIMIT 1
  `) as Array<{ stripe_object_id: string | null }>;

  if (!rows[0]) {
    return null;
  }

  let stripePriceId: string | null = null;
  try {
    stripePriceId = getUpsellPriceId("professional_email");
  } catch {
    stripePriceId = process.env.STRIPE_PRICE_UPSELL_EMAIL?.trim() ?? null;
  }

  return {
    stripeSubscriptionId: rows[0].stripe_object_id,
    stripePriceId,
  };
}

export function isProfessionalEmailPriceId(priceId: string | null | undefined): boolean {
  if (!priceId) return false;
  const expected = process.env.STRIPE_PRICE_UPSELL_EMAIL?.trim();
  return Boolean(expected && priceId === expected);
}
