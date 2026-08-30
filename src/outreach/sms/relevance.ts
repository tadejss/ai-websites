import { clientSiteExists } from "@/leads/client-exists";
import { getDemoUrl } from "@/leads/demo-url";
import { readAllLeads, type LeadRecord } from "@/leads/store";
import { getCustomerSlugSet } from "@/customers/store";
import { listSmsLeadStates } from "./store";
import type { SmsLeadState } from "./types";
import { isSlovenianMobilePhone } from "./phone";

/**
 * Admin sales-pipeline relevance for SMS-only outreach.
 * Not a substitute for enqueue-time evaluateSmsEligibility().
 */
export function isRelevantSmsLead(lead: LeadRecord): boolean {
  if (lead.existingWebsite?.trim()) {
    return false;
  }

  if (!isSlovenianMobilePhone(lead.phone)) {
    return false;
  }

  if (!lead.slug || !clientSiteExists(lead.slug)) {
    return false;
  }

  if (!getDemoUrl(lead)) {
    return false;
  }

  return true;
}

/**
 * Pre-generation gate: worth building a demo for SMS outreach?
 * (No existing site + valid mobile. Demo may not exist yet.)
 */
export function isSmsGenerationCandidate(lead: LeadRecord): boolean {
  if (lead.existingWebsite?.trim()) {
    return false;
  }

  return isSlovenianMobilePhone(lead.phone);
}

export function isSmsOptedOutState(
  state: SmsLeadState | null | undefined,
): boolean {
  if (!state) {
    return false;
  }
  return state.smsStatus === "opted_out" || state.smsAllowed === false;
}

/**
 * Actionable for the SMS sales pipeline:
 * relevant properties + not a customer + not opted out.
 */
export function isActionableSmsLead(
  lead: LeadRecord,
  options: {
    customerSlugs: Set<string>;
    smsBySlug?: Map<string, SmsLeadState>;
  },
): boolean {
  if (!isRelevantSmsLead(lead)) {
    return false;
  }
  if (options.customerSlugs.has(lead.slug) || lead.status === "customer") {
    return false;
  }
  const state = options.smsBySlug?.get(lead.slug);
  if (isSmsOptedOutState(state)) {
    return false;
  }
  return true;
}

export async function countActionableSmsLeads(): Promise<number> {
  const leads = readAllLeads();
  const customerSlugs = await getCustomerSlugSet();
  const smsStates = await listSmsLeadStates();
  const smsBySlug = new Map(smsStates.map((state) => [state.slug, state]));

  let count = 0;
  for (const lead of leads) {
    if (isActionableSmsLead(lead, { customerSlugs, smsBySlug })) {
      count += 1;
    }
  }
  return count;
}
