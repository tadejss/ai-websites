import Stripe from "stripe";

export type CheckoutPlan = "monthly" | "yearly";

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  return new Stripe(secretKey);
}

export function getPriceIdForPlan(plan: CheckoutPlan): string {
  const priceId =
    plan === "monthly"
      ? process.env.STRIPE_PRICE_MONTHLY?.trim()
      : process.env.STRIPE_PRICE_YEARLY?.trim();

  if (!priceId) {
    throw new Error(
      plan === "monthly"
        ? "STRIPE_PRICE_MONTHLY is not configured"
        : "STRIPE_PRICE_YEARLY is not configured",
    );
  }

  return priceId;
}

export function isCheckoutPlan(value: unknown): value is CheckoutPlan {
  return value === "monthly" || value === "yearly";
}

export function planLabel(plan: CheckoutPlan): string {
  return plan === "monthly" ? "Mesečno" : "Letno";
}

const SI_VAT_PERCENT = 22;

/** Prefer STRIPE_TAX_RATE_ID; otherwise find an active 22 % exclusive rate in Stripe. */
export async function resolveTaxRateId(stripe: Stripe): Promise<string | undefined> {
  const configured = process.env.STRIPE_TAX_RATE_ID?.trim();

  if (configured) {
    return configured;
  }

  const rates = await stripe.taxRates.list({ active: true, limit: 100 });
  const match = rates.data.find(
    (rate) =>
      rate.active &&
      !rate.inclusive &&
      rate.percentage === SI_VAT_PERCENT &&
      (rate.jurisdiction === "SI" || rate.country === "SI" || !rate.jurisdiction),
  );

  return match?.id;
}
