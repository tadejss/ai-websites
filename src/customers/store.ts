import type { CheckoutPlan } from "@/billing/stripe";
import type { UpsellType } from "@/billing/upsells";
import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";

export type CustomerRecord = {
  slug: string;
  status: "customer";
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  subscriptionPlan: CheckoutPlan | null;
  purchasedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerPurchaseKind = "base_subscription" | "upsell";

export type CustomerPurchaseRecord = {
  id: number;
  slug: string;
  purchaseKind: CustomerPurchaseKind;
  upsellType: UpsellType | null;
  stripeCheckoutSessionId: string;
  stripeCustomerId: string;
  stripeObjectId: string | null;
  purchasedAt: string;
  createdAt: string;
};

type CustomerRow = {
  slug: string;
  status: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  subscription_plan: string | null;
  purchased_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
};

type PurchaseRow = {
  id: string | number;
  slug: string;
  purchase_kind: string;
  upsell_type: string | null;
  stripe_checkout_session_id: string;
  stripe_customer_id: string;
  stripe_object_id: string | null;
  purchased_at: Date | string;
  created_at: Date | string;
};

function toIso(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(value).toISOString();
}

function mapCustomer(row: CustomerRow): CustomerRecord {
  const plan =
    row.subscription_plan === "monthly" || row.subscription_plan === "yearly"
      ? row.subscription_plan
      : null;

  return {
    slug: row.slug,
    status: "customer",
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    subscriptionPlan: plan,
    purchasedAt: toIso(row.purchased_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapPurchase(row: PurchaseRow): CustomerPurchaseRecord {
  return {
    id: Number(row.id),
    slug: row.slug,
    purchaseKind: row.purchase_kind as CustomerPurchaseKind,
    upsellType: (row.upsell_type as UpsellType | null) ?? null,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeObjectId: row.stripe_object_id,
    purchasedAt: toIso(row.purchased_at),
    createdAt: toIso(row.created_at),
  };
}

async function requireDb(): Promise<ReturnType<typeof sql>> {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured");
  }
  await ensureCustomerSchema();
  return sql();
}

export async function getCustomerBySlug(
  slug: string,
): Promise<CustomerRecord | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT *
    FROM customers
    WHERE slug = ${slug}
    LIMIT 1
  `) as CustomerRow[];
  return rows[0] ? mapCustomer(rows[0]) : null;
}

export async function getCustomerByStripeCustomerId(
  customerId: string,
): Promise<CustomerRecord | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT *
    FROM customers
    WHERE stripe_customer_id = ${customerId}
    LIMIT 1
  `) as CustomerRow[];
  return rows[0] ? mapCustomer(rows[0]) : null;
}

export async function isCustomer(slug: string): Promise<boolean> {
  const customer = await getCustomerBySlug(slug);
  return customer?.status === "customer";
}

export async function getCustomerPurchases(
  slug: string,
): Promise<CustomerPurchaseRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT *
    FROM customer_purchases
    WHERE slug = ${slug}
    ORDER BY purchased_at ASC
  `) as PurchaseRow[];
  return rows.map(mapPurchase);
}

export async function getPurchasedUpsellTypes(
  slug: string,
): Promise<UpsellType[]> {
  const purchases = await getCustomerPurchases(slug);
  return purchases
    .filter(
      (purchase) => purchase.purchaseKind === "upsell" && purchase.upsellType,
    )
    .map((purchase) => purchase.upsellType as UpsellType);
}

export type UpsertCustomerFromCheckoutInput = {
  slug: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
  subscriptionPlan?: CheckoutPlan | null;
  checkoutSessionId: string;
  purchasedAt?: Date;
};

/** Idempotent base subscription registration. */
export async function upsertCustomerFromCheckout(
  input: UpsertCustomerFromCheckoutInput,
): Promise<{ customer: CustomerRecord; alreadyProcessed: boolean }> {
  const db = await requireDb();
  const purchasedAt = (input.purchasedAt ?? new Date()).toISOString();
  const subscriptionId = input.stripeSubscriptionId ?? null;
  const plan = input.subscriptionPlan ?? null;

  const existingSession = (await db`
    SELECT 1
    FROM customer_purchases
    WHERE stripe_checkout_session_id = ${input.checkoutSessionId}
    LIMIT 1
  `) as unknown[];

  const alreadyProcessed = existingSession.length > 0;

  const rows = (await db`
    INSERT INTO customers (
      slug,
      status,
      stripe_customer_id,
      stripe_subscription_id,
      subscription_plan,
      purchased_at,
      created_at,
      updated_at
    )
    VALUES (
      ${input.slug},
      'customer',
      ${input.stripeCustomerId},
      ${subscriptionId},
      ${plan},
      ${purchasedAt},
      NOW(),
      NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
      status = 'customer',
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      stripe_subscription_id = COALESCE(
        EXCLUDED.stripe_subscription_id,
        customers.stripe_subscription_id
      ),
      subscription_plan = COALESCE(
        EXCLUDED.subscription_plan,
        customers.subscription_plan
      ),
      purchased_at = LEAST(customers.purchased_at, EXCLUDED.purchased_at),
      updated_at = NOW()
    RETURNING *
  `) as CustomerRow[];

  await db`
    INSERT INTO customer_purchases (
      slug,
      purchase_kind,
      upsell_type,
      stripe_checkout_session_id,
      stripe_customer_id,
      stripe_object_id,
      purchased_at
    )
    VALUES (
      ${input.slug},
      'base_subscription',
      NULL,
      ${input.checkoutSessionId},
      ${input.stripeCustomerId},
      ${subscriptionId},
      ${purchasedAt}
    )
    ON CONFLICT (stripe_checkout_session_id) DO NOTHING
  `;

  const customer = rows[0]
    ? mapCustomer(rows[0])
    : await getCustomerBySlug(input.slug);

  if (!customer) {
    throw new Error(`Failed to upsert customer for slug "${input.slug}"`);
  }

  return { customer, alreadyProcessed };
}

export type RecordUpsellPurchaseInput = {
  slug: string;
  upsellType: UpsellType;
  stripeCustomerId: string;
  checkoutSessionId: string;
  stripeObjectId?: string | null;
  purchasedAt?: Date;
};

/** Idempotent upsell registration (session id + slug/upsell_type unique). */
export async function recordCustomerUpsellPurchase(
  input: RecordUpsellPurchaseInput,
): Promise<{ customer: CustomerRecord; alreadyProcessed: boolean }> {
  const db = await requireDb();
  const purchasedAt = (input.purchasedAt ?? new Date()).toISOString();

  await db`
    INSERT INTO customers (
      slug,
      status,
      stripe_customer_id,
      stripe_subscription_id,
      subscription_plan,
      purchased_at,
      created_at,
      updated_at
    )
    VALUES (
      ${input.slug},
      'customer',
      ${input.stripeCustomerId},
      NULL,
      NULL,
      ${purchasedAt},
      NOW(),
      NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
      status = 'customer',
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      updated_at = NOW()
  `;

  const existing = (await db`
    SELECT 1
    FROM customer_purchases
    WHERE stripe_checkout_session_id = ${input.checkoutSessionId}
       OR (slug = ${input.slug} AND upsell_type = ${input.upsellType})
    LIMIT 1
  `) as unknown[];

  const alreadyProcessed = existing.length > 0;

  if (!alreadyProcessed) {
    await db`
      INSERT INTO customer_purchases (
        slug,
        purchase_kind,
        upsell_type,
        stripe_checkout_session_id,
        stripe_customer_id,
        stripe_object_id,
        purchased_at
      )
      VALUES (
        ${input.slug},
        'upsell',
        ${input.upsellType},
        ${input.checkoutSessionId},
        ${input.stripeCustomerId},
        ${input.stripeObjectId ?? null},
        ${purchasedAt}
      )
      ON CONFLICT (stripe_checkout_session_id) DO NOTHING
    `;
  }

  const customer = await getCustomerBySlug(input.slug);
  if (!customer) {
    throw new Error(`Customer missing after upsell for slug "${input.slug}"`);
  }

  return { customer, alreadyProcessed };
}

export async function hasUpsellPurchase(
  slug: string,
  upsellType: UpsellType,
): Promise<boolean> {
  const types = await getPurchasedUpsellTypes(slug);
  return types.includes(upsellType);
}

/** All slugs with a persistent customer record (for admin list). */
export async function getCustomerSlugSet(): Promise<Set<string>> {
  if (!isDatabaseConfigured()) {
    return new Set();
  }

  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT slug FROM customers
  `) as Array<{ slug: string }>;

  return new Set(rows.map((row) => row.slug));
}
