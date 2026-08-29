import type { UpsellType } from "@/billing/upsells";
import type { LeadRecord } from "@/leads/store";
import { readLead } from "@/leads/store";
import { resolveCheckoutLead } from "@/leads/checkout-lead";
import {
  getCustomerBySlug,
  getCustomerPurchases,
  getPurchasedUpsellTypes,
  type CustomerPurchaseRecord,
  type CustomerRecord,
} from "./store";

export type LeadWithCustomerState = LeadRecord & {
  /** Persistent customer row when present (source of truth for payment state). */
  customer: CustomerRecord | null;
  purchases: CustomerPurchaseRecord[];
  purchasedUpsellTypes: UpsellType[];
};

/**
 * Merge static lead JSON with persistent customer/payment state.
 * Customer DB wins for status, Stripe IDs, plan, purchasedAt, upsells.
 */
export async function getLeadWithCustomerState(
  slug: string,
): Promise<LeadWithCustomerState | null> {
  const lead = readLead(slug);
  const customer = await getCustomerBySlug(slug);
  const purchases = customer ? await getCustomerPurchases(slug) : [];
  const purchasedUpsellTypes = customer
    ? await getPurchasedUpsellTypes(slug)
    : [];

  if (!lead && !customer) {
    return null;
  }

  const base: LeadRecord = lead ?? resolveCheckoutLead(slug);

  if (!customer) {
    return {
      ...base,
      customer: null,
      purchases: [],
      purchasedUpsellTypes: [],
    };
  }

  return {
    ...base,
    status: "customer",
    stripeCustomerId: customer.stripeCustomerId,
    stripeSubscriptionId: customer.stripeSubscriptionId ?? undefined,
    subscriptionPlan: customer.subscriptionPlan ?? undefined,
    purchasedAt: customer.purchasedAt,
    purchasedUpsells: purchasedUpsellTypes,
    customer,
    purchases,
    purchasedUpsellTypes,
  };
}

/** Like getLeadWithCustomerState but always returns a lead-shaped record. */
export async function resolveLeadWithCustomerState(
  slug: string,
): Promise<LeadWithCustomerState> {
  const merged = await getLeadWithCustomerState(slug);
  if (merged) {
    return merged;
  }

  return {
    ...resolveCheckoutLead(slug),
    customer: null,
    purchases: [],
    purchasedUpsellTypes: [],
  };
}
