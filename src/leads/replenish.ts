import { createClientFromLead } from "@/clients/create-client-from-lead";
import { clientSiteExists } from "@/leads/client-exists";
import { discoverLeads } from "@/leads/discover";
import {
  buildIcpDiscoverySlots,
  nextIcpSlot,
  readReplenishCursor,
  writeReplenishCursor,
  type IcpDiscoverySlot,
} from "@/leads/icp";
import { readLead } from "@/leads/store";
import {
  getSmsConfig,
  smsLeadReplenishToGenerate,
  smsLeadReplenishmentNeeded,
} from "@/outreach/sms/config";
import {
  countActionableSmsLeads,
  isSmsGenerationCandidate,
} from "@/outreach/sms/relevance";
import { isSlovenianMobilePhone, normalizeSlovenianPhone } from "@/outreach/sms/phone";

export type ReplenishStats = {
  actionableBefore: number;
  target: number;
  needed: number;
  toGenerate: number;
  candidatesDiscovered: number;
  rejectedExistingWebsite: number;
  rejectedMissingPhone: number;
  rejectedInvalidOrLandline: number;
  duplicates: number;
  demosGenerated: number;
  actionableAfter: number | null;
  errors: string[];
  slotsTried: number;
};

export type ReplenishDependencies = {
  countActionable: () => Promise<number>;
  discover: typeof discoverLeads;
  createFromLead: typeof createClientFromLead;
  readLeadBySlug: typeof readLead;
  siteExists: typeof clientSiteExists;
  readCursor: () => number;
  writeCursor: (slotIndex: number) => void;
  slots: IcpDiscoverySlot[];
  placesLimitPerQuery: number;
};

const DEFAULT_DEPS: ReplenishDependencies = {
  countActionable: countActionableSmsLeads,
  discover: discoverLeads,
  createFromLead: createClientFromLead,
  readLeadBySlug: readLead,
  siteExists: clientSiteExists,
  readCursor: readReplenishCursor,
  writeCursor: writeReplenishCursor,
  slots: buildIcpDiscoverySlots(),
  placesLimitPerQuery: 20,
};

function classifyRejectReason(lead: {
  existingWebsite?: string;
  phone?: string;
}):
  | "website"
  | "missing_phone"
  | "invalid_or_landline"
  | null {
  if (lead.existingWebsite?.trim()) {
    return "website";
  }
  if (!lead.phone?.trim()) {
    return "missing_phone";
  }
  if (!normalizeSlovenianPhone(lead.phone).ok || !isSlovenianMobilePhone(lead.phone)) {
    return "invalid_or_landline";
  }
  return null;
}

/**
 * Top up actionable SMS leads toward SMS_LEAD_TARGET, capped by batch.
 * Recalculates actionable count at the start of every invocation.
 */
export async function replenishSmsLeads(
  deps: Partial<ReplenishDependencies> = {},
): Promise<ReplenishStats> {
  const d: ReplenishDependencies = { ...DEFAULT_DEPS, ...deps };
  const config = getSmsConfig();
  const target = config.leadTarget;
  const batch = config.leadReplenishBatch;

  const actionableBefore = await d.countActionable();
  const needed = smsLeadReplenishmentNeeded(actionableBefore, target);
  const toGenerate = smsLeadReplenishToGenerate(actionableBefore, {
    target,
    batch,
  });

  const stats: ReplenishStats = {
    actionableBefore,
    target,
    needed,
    toGenerate,
    candidatesDiscovered: 0,
    rejectedExistingWebsite: 0,
    rejectedMissingPhone: 0,
    rejectedInvalidOrLandline: 0,
    duplicates: 0,
    demosGenerated: 0,
    actionableAfter: null,
    errors: [],
    slotsTried: 0,
  };

  if (toGenerate <= 0) {
    stats.actionableAfter = actionableBefore;
    return stats;
  }

  let cursor = d.readCursor();
  const maxSlotAttempts = Math.max(d.slots.length * 2, 1);

  for (let attempt = 0; attempt < maxSlotAttempts; attempt += 1) {
    if (stats.demosGenerated >= toGenerate) {
      break;
    }

    const { slot, nextIndex } = nextIcpSlot(cursor, d.slots);
    cursor = nextIndex;
    stats.slotsTried += 1;

    let discovered;
    try {
      discovered = await d.discover(slot.query, d.placesLimitPerQuery, {
        withoutWebsiteOnly: true,
        industry: slot.industry,
        region: slot.region,
        sourceQuery: slot.query,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      stats.errors.push(`discover "${slot.query}": ${message}`);
      d.writeCursor(cursor);
      // Graceful: stop Places loop on hard API failure; keep prior demos.
      break;
    }

    d.writeCursor(cursor);

    for (const result of discovered) {
      if (stats.demosGenerated >= toGenerate) {
        break;
      }

      if (result.outcome === "skipped") {
        if (result.reason === "already known") {
          stats.duplicates += 1;
        } else if (result.reason === "already has a website") {
          stats.rejectedExistingWebsite += 1;
        }
        continue;
      }

      stats.candidatesDiscovered += 1;
      const lead = d.readLeadBySlug(result.slug);
      if (!lead) {
        stats.errors.push(`missing lead file after discover: ${result.slug}`);
        continue;
      }

      const reject = classifyRejectReason(lead);
      if (reject === "website") {
        stats.rejectedExistingWebsite += 1;
        continue;
      }
      if (reject === "missing_phone") {
        stats.rejectedMissingPhone += 1;
        continue;
      }
      if (reject === "invalid_or_landline") {
        stats.rejectedInvalidOrLandline += 1;
        continue;
      }

      if (!isSmsGenerationCandidate(lead)) {
        stats.rejectedInvalidOrLandline += 1;
        continue;
      }

      if (d.siteExists(lead.slug)) {
        stats.duplicates += 1;
        continue;
      }

      try {
        const created = await d.createFromLead(lead.slug);
        if (created.outcome === "created") {
          stats.demosGenerated += 1;
        } else {
          if (created.reason.includes("website")) {
            stats.rejectedExistingWebsite += 1;
          } else if (created.reason.includes("mobile")) {
            stats.rejectedInvalidOrLandline += 1;
          } else if (created.reason.includes("already exists")) {
            stats.duplicates += 1;
          } else {
            stats.errors.push(`${lead.slug}: ${created.reason}`);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        stats.errors.push(`${lead.slug}: ${message}`);
      }
    }
  }

  try {
    stats.actionableAfter = await d.countActionable();
  } catch {
    stats.actionableAfter = null;
  }

  return stats;
}

/** Status-only snapshot for Vercel cron / admin (no Places, no generation). */
export async function getReplenishStatus(): Promise<{
  actionable: number;
  target: number;
  needed: number;
  batch: number;
}> {
  const config = getSmsConfig();
  const actionable = await countActionableSmsLeads();
  return {
    actionable,
    target: config.leadTarget,
    needed: smsLeadReplenishmentNeeded(actionable, config.leadTarget),
    batch: config.leadReplenishBatch,
  };
}
