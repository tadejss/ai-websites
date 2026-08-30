import { clientSiteExists } from "@/leads/client-exists";
import { getDemoUrl } from "@/leads/demo-url";
import type { LeadRecord } from "@/leads/store";
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
