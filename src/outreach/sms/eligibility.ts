import { isOutreachSuppressed } from "@/leads/statuses";
import type { LeadRecord } from "@/leads/store";
import { clientSiteExists } from "@/leads/client-exists";
import { getDemoUrl } from "@/leads/demo-url";
import type { SmsLeadState, SmsStep } from "./types";
import { normalizeSlovenianPhone } from "./phone";

export type SmsEligibilityResult =
  | { ok: true; phone: string; step: SmsStep }
  | { ok: false; reason: string };

function hasDemoSite(lead: LeadRecord): boolean {
  return Boolean(lead.slug && clientSiteExists(lead.slug) && getDemoUrl(lead));
}

/**
 * Automated SMS eligibility. Manual queue may pass `force` at the API layer.
 */
export function evaluateSmsEligibility(input: {
  lead: LeadRecord;
  isCustomer: boolean;
  state: SmsLeadState | null;
  step: SmsStep;
  alreadySentForStep: boolean;
}): SmsEligibilityResult {
  const { lead, isCustomer, state, step, alreadySentForStep } = input;

  if (isCustomer || lead.status === "customer") {
    return { ok: false, reason: "Lead is already a customer" };
  }

  if (isOutreachSuppressed(lead.status)) {
    return { ok: false, reason: `Lead status "${lead.status}" is suppressed` };
  }

  if (state?.smsStatus === "opted_out" || state?.smsAllowed === false) {
    return { ok: false, reason: "Lead opted out of SMS" };
  }

  if (!hasDemoSite(lead)) {
    return { ok: false, reason: "Demo site is not ready" };
  }

  const phone = normalizeSlovenianPhone(lead.phone);
  if (!phone.ok) {
    return { ok: false, reason: phone.error };
  }

  if (alreadySentForStep) {
    return { ok: false, reason: `SMS step "${step}" already sent or queued` };
  }

  return { ok: true, phone: phone.e164, step };
}
