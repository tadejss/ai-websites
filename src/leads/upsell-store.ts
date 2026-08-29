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

/** Idempotent: skip if session or upsell type already recorded. */
export function recordUpsellPurchase(
  slug: string,
  type: UpsellType,
  checkoutSessionId: string,
): LeadRecord {
  const existing = readLead(slug);

  if (
    hasRecordedUpsellSession(existing, checkoutSessionId) ||
    hasPurchasedUpsell(existing, type)
  ) {
    return existing ?? resolveCheckoutLead(slug);
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

  const patched = patchLead(slug, { upsellRecords, purchasedUpsells });
  if (patched) {
    return patched;
  }

  const created: LeadRecord = {
    ...resolveCheckoutLead(slug),
    upsellRecords,
    purchasedUpsells,
  };
  saveLead(created);
  return created;
}
