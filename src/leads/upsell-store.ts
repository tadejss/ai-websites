import type { UpsellType } from "@/billing/upsells";
import {
  getPurchasedUpsellTypes as getPurchasedUpsellTypesFromDb,
  hasUpsellPurchase,
  recordCustomerUpsellPurchase,
} from "@/customers/store";
import { isDatabaseConfigured } from "@/db/client";
import { resolveCheckoutLead } from "./checkout-lead";
import { readLead, type LeadRecord, type UpsellPurchaseRecord } from "./store";

export type { UpsellPurchaseRecord };

/**
 * Prefer persistent DB when configured; fall back to lead JSON (local/dev).
 */
export async function getPurchasedUpsellTypes(
  slugOrLead: string | LeadRecord | null,
): Promise<UpsellType[]> {
  const slug =
    typeof slugOrLead === "string"
      ? slugOrLead
      : slugOrLead?.slug?.trim() || "";

  if (slug && isDatabaseConfigured()) {
    try {
      return await getPurchasedUpsellTypesFromDb(slug);
    } catch (error) {
      console.warn(
        "[upsell-store] DB read failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  const lead =
    typeof slugOrLead === "string" ? readLead(slugOrLead) : slugOrLead;
  return getPurchasedUpsellTypesFromLead(lead);
}

export function getPurchasedUpsellTypesFromLead(
  lead: LeadRecord | null,
): UpsellType[] {
  if (!lead) {
    return [];
  }
  const fromRecords = (lead.upsellRecords ?? [])
    .filter(
      (record): record is UpsellPurchaseRecord =>
        Boolean(record?.type && record?.checkoutSessionId && record?.purchasedAt),
    )
    .map((record) => record.type);
  const fromLegacy = lead.purchasedUpsells ?? [];
  return [...new Set([...fromRecords, ...fromLegacy])];
}

export async function hasPurchasedUpsell(
  slug: string,
  type: UpsellType,
): Promise<boolean> {
  if (isDatabaseConfigured()) {
    try {
      return await hasUpsellPurchase(slug, type);
    } catch (error) {
      console.warn(
        "[upsell-store] DB hasPurchasedUpsell failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  const lead = readLead(slug);
  return getPurchasedUpsellTypesFromLead(lead).includes(type);
}

/**
 * Record upsell in persistent DB when configured.
 * Returns a lead-shaped record for callers that still expect LeadRecord.
 * Never throws.
 */
export async function recordUpsellPurchase(
  slug: string,
  type: UpsellType,
  checkoutSessionId: string,
  stripeCustomerId?: string,
  stripeObjectId?: string | null,
): Promise<LeadRecord> {
  const fallback = resolveCheckoutLead(slug);

  if (isDatabaseConfigured() && stripeCustomerId) {
    try {
      const { customer } = await recordCustomerUpsellPurchase({
        slug,
        upsellType: type,
        stripeCustomerId,
        checkoutSessionId,
        stripeObjectId: stripeObjectId ?? null,
      });
      return {
        ...fallback,
        status: customer.status,
        stripeCustomerId: customer.stripeCustomerId,
        stripeSubscriptionId: customer.stripeSubscriptionId ?? undefined,
        subscriptionPlan: customer.subscriptionPlan ?? undefined,
        purchasedAt: customer.purchasedAt,
        purchasedUpsells: await getPurchasedUpsellTypesFromDb(slug),
      };
    } catch (error) {
      console.warn(
        "[upsell-store] DB write failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  // Local/dev fallback: do not rely on FS writes for production truth.
  const existingTypes = getPurchasedUpsellTypesFromLead(
    readLead(slug) ?? fallback,
  );
  if (existingTypes.includes(type)) {
    return fallback;
  }

  return {
    ...fallback,
    purchasedUpsells: [...new Set([...existingTypes, type])],
    upsellRecords: [
      ...(fallback.upsellRecords ?? []),
      {
        type,
        checkoutSessionId,
        purchasedAt: new Date().toISOString(),
      },
    ],
  };
}
