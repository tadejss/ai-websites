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
