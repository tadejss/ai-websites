import type { UpsellType } from "@/billing/upsells";
import { resolveCheckoutLead } from "./checkout-lead";
import {
  patchLead,
  readLead,
  saveLead,
  type LeadRecord,
  type UpsellPurchaseRecord,
} from "./store";

export type { UpsellPurchaseRecord };

function normalizeUpsellRecords(
  lead: LeadRecord | null,
): UpsellPurchaseRecord[] {
  if (!lead?.upsellRecords?.length) {
    return [];
  }
  return lead.upsellRecords.filter(
    (record): record is UpsellPurchaseRecord =>
      Boolean(record?.type && record?.checkoutSessionId && record?.purchasedAt),
  );
}

export function getPurchasedUpsellTypes(lead: LeadRecord | null): UpsellType[] {
  const fromRecords = normalizeUpsellRecords(lead).map((record) => record.type);
  const fromLegacy = lead?.purchasedUpsells ?? [];
  return [...new Set([...fromRecords, ...fromLegacy])];
}

export function hasPurchasedUpsell(
  lead: LeadRecord | null,
  type: UpsellType,
): boolean {
  return getPurchasedUpsellTypes(lead).includes(type);
}

export function hasRecordedUpsellSession(
  lead: LeadRecord | null,
  checkoutSessionId: string,
): boolean {
  return normalizeUpsellRecords(lead).some(
    (record) => record.checkoutSessionId === checkoutSessionId,
  );
}

/** Idempotent: skip if session or upsell type already recorded. Never throws. */
export function recordUpsellPurchase(
  slug: string,
  type: UpsellType,
  checkoutSessionId: string,
): LeadRecord {
  const existing = readLead(slug);
  const fallback = existing ?? resolveCheckoutLead(slug);

  if (
    hasRecordedUpsellSession(existing, checkoutSessionId) ||
    hasPurchasedUpsell(existing, type)
  ) {
    return fallback;
  }

  const record: UpsellPurchaseRecord = {
    type,
    checkoutSessionId,
    purchasedAt: new Date().toISOString(),
  };

  const upsellRecords = [...normalizeUpsellRecords(existing), record];
  const purchasedUpsells = [
    ...new Set([...getPurchasedUpsellTypes(existing), type]),
  ];

  try {
    const patched = patchLead(slug, { upsellRecords, purchasedUpsells });
    if (patched) {
      return patched;
    }

    const created: LeadRecord = {
      ...fallback,
      upsellRecords,
      purchasedUpsells,
    };
    saveLead(created);
    return created;
  } catch (error) {
    // Vercel serverless FS is often read-only; Stripe remains source of truth.
    console.warn(
      "[upsell-store] write failed:",
      error instanceof Error ? error.message : error,
    );
    return {
      ...fallback,
      upsellRecords,
      purchasedUpsells,
    };
  }
}
