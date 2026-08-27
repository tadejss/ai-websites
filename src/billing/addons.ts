/**
 * Optional one-time add-ons offered after subscription payment
 * via Stripe Checkout Upsells (see docs/CHECKOUT.md).
 *
 * Wire `envPriceKey` values in Vercel once Stripe Prices exist;
 * session upsell config is intentionally not hooked up yet.
 */

export type CheckoutAddonId =
  | "business_email"
  | "gbp_update"
  | "review_board";

export type CheckoutAddon = {
  id: CheckoutAddonId;
  label: string;
  description: string;
  /** Env var holding the Stripe one-time Price ID (e.g. price_...). */
  envPriceKey: string;
};

export const CHECKOUT_ADDONS: readonly CheckoutAddon[] = [
  {
    id: "business_email",
    label: "Poslovni mail",
    description: "Profesionalni e-poštni naslov, npr. info@tvoja-domena.si.",
    envPriceKey: "STRIPE_PRICE_ADDON_EMAIL",
  },
  {
    id: "gbp_update",
    label: "Google Business Profile",
    description:
      "Posodobitev Google profila z novimi podatki, vključno s spletno stranjo.",
    envPriceKey: "STRIPE_PRICE_ADDON_GBP",
  },
  {
    id: "review_board",
    label: "Google review tabla",
    description: "Fizična NFC + QR tabla za zbiranje Google ocen.",
    envPriceKey: "STRIPE_PRICE_ADDON_REVIEW_BOARD",
  },
] as const;

export function getAddonPriceId(addon: CheckoutAddon): string | undefined {
  const value = process.env[addon.envPriceKey]?.trim();
  return value || undefined;
}

export function listConfiguredAddons(): CheckoutAddon[] {
  return CHECKOUT_ADDONS.filter((addon) => Boolean(getAddonPriceId(addon)));
}
