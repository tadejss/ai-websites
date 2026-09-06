import { isCustomer } from "@/customers/store";
import { getOutreachConfig } from "@/outreach/config";
import { readAllLeads } from "@/leads/store";
import { getSmsConfig } from "./config";
import { evaluateSmsEligibility } from "./eligibility";
import { enqueueSmsForLead } from "./queue";
import {
  countDailySmsBudgetUsed,
  getSmsLeadState,
  hasActiveOrSentStep,
  isSmsOptedOut,
} from "./store";
import { normalizeSlovenianPhone } from "./phone";
import type { SmsLeadState, SmsStep } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type EnqueueBatchResult = {
  considered: number;
  queued: number;
  skipped: number;
  errors: string[];
};

function followupDue(sentAt: string | null, days: number): boolean {
  if (!sentAt) {
    return false;
  }
  const elapsed = (Date.now() - Date.parse(sentAt)) / MS_PER_DAY;
  return Number.isFinite(elapsed) && elapsed >= days;
}

/** Pure due-step resolver using prefetched SMS state + sent steps. */
export function resolveDueSmsStepFromCaches(
  state: SmsLeadState | null | undefined,
  sentSteps: Set<SmsStep> | undefined,
  leadStatus: string | undefined,
): SmsStep | null {
  const config = getOutreachConfig();

  if (state?.smsStatus === "opted_out" || state?.smsAllowed === false) {
    return null;
  }

  const steps = sentSteps ?? new Set<SmsStep>();
  const initialSent = steps.has("initial");
  if (!initialSent) {
    if (leadStatus === "generated" || leadStatus === "contacted" || !leadStatus) {
      return "initial";
    }
    return "initial";
  }

  const follow1 = steps.has("followup_1");
  if (!follow1 && followupDue(state?.smsSentAt ?? null, config.followup1Days)) {
    return "followup_1";
  }

  const follow2 = steps.has("followup_2");
  if (follow1 && !follow2 && followupDue(state?.smsSentAt ?? null, config.followup2Days)) {
    return "followup_2";
  }

  return null;
}

export async function resolveDueSmsStep(
  slug: string,
  leadStatus: string | undefined,
): Promise<SmsStep | null> {
  const state = await getSmsLeadState(slug);
  if (state?.smsStatus === "opted_out" || state?.smsAllowed === false) {
    return null;
  }

  const sentSteps = new Set<SmsStep>();
  if (!(await hasActiveOrSentStep(slug, "initial"))) {
    return resolveDueSmsStepFromCaches(state, sentSteps, leadStatus);
  }
  sentSteps.add("initial");
  if (await hasActiveOrSentStep(slug, "followup_1")) {
    sentSteps.add("followup_1");
    if (await hasActiveOrSentStep(slug, "followup_2")) {
      sentSteps.add("followup_2");
    }
  }
  return resolveDueSmsStepFromCaches(state, sentSteps, leadStatus);
}

export async function enqueueDueSmsBatch(): Promise<EnqueueBatchResult> {
  const config = getSmsConfig();
  const budgetUsed = await countDailySmsBudgetUsed();
  let remaining = Math.max(0, config.dailyLimit - budgetUsed);
  const errors: string[] = [];
  let queued = 0;
  let skipped = 0;
  let considered = 0;

  const leads = readAllLeads();

  for (const lead of leads) {
    if (remaining <= 0) {
      break;
    }

    considered += 1;
    const customer = await isCustomer(lead.slug);
    const state = await getSmsLeadState(lead.slug);
    const step = await resolveDueSmsStep(lead.slug, lead.status);

    if (!step) {
      skipped += 1;
      continue;
    }

    const already = await hasActiveOrSentStep(lead.slug, step);
    const phone = normalizeSlovenianPhone(lead.phone);
    const globallyOptedOut = phone.ok ? await isSmsOptedOut(phone.e164) : false;
    const eligibility = evaluateSmsEligibility({
      lead,
      isCustomer: customer,
      state,
      step,
      alreadySentForStep: already,
      globallyOptedOut,
    });

    if (!eligibility.ok) {
      skipped += 1;
      continue;
    }

    const result = await enqueueSmsForLead({ lead, step });
    if (result.ok) {
      queued += 1;
      remaining -= 1;
    } else {
      skipped += 1;
      errors.push(`${lead.slug}: ${result.error}`);
    }
  }

  return { considered, queued, skipped, errors };
}
