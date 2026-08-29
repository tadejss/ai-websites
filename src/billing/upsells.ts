import type Stripe from "stripe";

export type UpsellType =
  | "google_business"
  | "seo"
  | "professional_email";

export type UpsellBillingMode = "payment" | "subscription";

export type UpsellDefinition = {
  type: UpsellType;
  envPriceKey: string;
  mode: UpsellBillingMode;
  title: string;
  headline: string;
  description: string;
  benefits: string[];
  priceLabel: string;
  compareAtLabel?: string;
  cta: string;
  recurringNote?: string;
  example?: string;
};

const UPSELL_TYPES: UpsellType[] = [
  "google_business",
  "seo",
  "professional_email",
];

export function isUpsellType(value: unknown): value is UpsellType {
  return typeof value === "string" && UPSELL_TYPES.includes(value as UpsellType);
}

export const UPSELL_DEFINITIONS: readonly UpsellDefinition[] = [
  {
    type: "google_business",
    envPriceKey: "STRIPE_PRICE_UPSELL_GOOGLE_BUSINESS",
    mode: "payment",
    title: "Google Business profil",
    headline: "Naj te ljudje najdejo tudi na Googlu.",
    description:
      "Uredimo in optimiziramo tvoj Google Business profil, da bo tvoj posel izgledal bolj profesionalno in ga bodo potencialne stranke lažje našle.",
    benefits: [
      "ureditev in optimizacija profila",
      "izboljšava opisa, kategorij in ključnih podatkov",
      "nasveti za fotografije, storitve in predstavitev podjetja",
    ],
    priceLabel: "39 €",
    compareAtLabel: "79 €",
    cta: "Dodaj za 39 €",
  },
  {
    type: "seo",
    envPriceKey: "STRIPE_PRICE_UPSELL_SEO",
    mode: "payment",
    title: "Osnovna SEO optimizacija",
    headline: "Da se tvoja stran ne konča na drugi strani Googla.",
    description:
      "Pred objavo uredimo osnovne SEO nastavitve, ki jih mora imeti dobra lokalna spletna stran.",
    benefits: [
      "naslovi in meta opisi",
      "struktura strani in headingi",
      "osnovni lokalni SEO signali",
    ],
    priceLabel: "29 €",
    compareAtLabel: "59 €",
    cta: "Dodaj SEO za 29 €",
  },
  {
    type: "professional_email",
    envPriceKey: "STRIPE_PRICE_UPSELL_EMAIL",
    mode: "subscription",
    title: "Profesionalni e-mail",
    headline:
      "info@tvojadomena.si izgleda precej bolj profesionalno kot Gmail.",
    description:
      "Uredi si e-mail na svoji domeni in komuniciraj s strankami pod svojim poslovnim naslovom.",
    benefits: [],
    example: "info@tvojadomena.si",
    priceLabel: "5 €/mesec",
    cta: "Dodaj profesionalni e-mail",
    recurringNote: "Mesečna naročnina, preklic kadarkoli.",
  },
] as const;

export function getUpsellDefinition(type: UpsellType): UpsellDefinition {
  const definition = UPSELL_DEFINITIONS.find((item) => item.type === type);
  if (!definition) {
    throw new Error(`Unknown upsell type: ${type}`);
  }
  return definition;
}

export function getUpsellPriceId(type: UpsellType): string {
  const definition = getUpsellDefinition(type);
  const priceId = process.env[definition.envPriceKey]?.trim();
  if (!priceId) {
    throw new Error(`${definition.envPriceKey} is not configured`);
  }
  return priceId;
}

export function listUpsellDefinitions(): UpsellDefinition[] {
  return [...UPSELL_DEFINITIONS];
}

export type VerifiedBaseCheckout = {
  session: Stripe.Checkout.Session;
  slug: string;
  customerId: string;
};

function customerIdFromSession(
  session: Stripe.Checkout.Session,
): string | undefined {
  const customer = session.customer;
  if (!customer) {
    return undefined;
  }
  return typeof customer === "string" ? customer : customer.id;
}

/** Verify a completed base subscription checkout session for upsell eligibility. */
export function verifyBaseCheckoutSession(
  session: Stripe.Checkout.Session,
  expectedSlug: string,
): VerifiedBaseCheckout | null {
  if (session.mode !== "subscription") {
    return null;
  }

  if (session.payment_status !== "paid") {
    return null;
  }

  const slug =
    session.metadata?.slug?.trim() ||
    session.client_reference_id?.trim() ||
    "";

  if (!slug || slug !== expectedSlug) {
    return null;
  }

  const customerId = customerIdFromSession(session);
  if (!customerId) {
    return null;
  }

  return { session, slug, customerId };
}

export function verifyUpsellCheckoutSession(
  session: Stripe.Checkout.Session,
  expectedSlug: string,
  expectedOriginalSessionId: string,
): { upsellType: UpsellType; slug: string } | null {
  const upsellTypeRaw = session.metadata?.upsell_type;
  if (!isUpsellType(upsellTypeRaw)) {
    return null;
  }

  // Subscription upsells are "complete" when paid; also accept paid payment mode.
  const paid =
    session.payment_status === "paid" ||
    session.status === "complete";
  if (!paid) {
    return null;
  }

  const slug = session.metadata?.slug?.trim() || "";
  if (!slug || slug !== expectedSlug) {
    return null;
  }

  const originalSessionId =
    session.metadata?.original_checkout_session_id?.trim() || "";
  if (originalSessionId !== expectedOriginalSessionId) {
    return null;
  }

  return { upsellType: upsellTypeRaw, slug };
}
