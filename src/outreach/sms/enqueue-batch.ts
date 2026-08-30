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
} from "./store";
import type { SmsStep } from "./types";

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

export async function resolveDueSmsStep(
  slug: string,
  leadStatus: string | undefined,
): Promise<SmsStep | null> {
  const state = await getSmsLeadState(slug);
  const config = getOutreachConfig();

  if (state?.smsStatus === "opted_out" || state?.smsAllowed === false) {
    return null;
  }

  const initialSent = await hasActiveOrSentStep(slug, "initial");
  if (!initialSent) {
    if (leadStatus === "generated" || leadStatus === "contacted" || !leadStatus) {
      return "initial";
    }
    return "initial";
  }

  const follow1 = await hasActiveOrSentStep(slug, "followup_1");
  if (!follow1 && followupDue(state?.smsSentAt ?? null, config.followup1Days)) {
    return "followup_1";
  }

  const follow2 = await hasActiveOrSentStep(slug, "followup_2");
  if (follow1 && !follow2 && followupDue(state?.smsSentAt ?? null, config.followup2Days)) {
    return "followup_2";
  }

  return null;
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
    const eligibility = evaluateSmsEligibility({
      lead,
      isCustomer: customer,
      state,
      step,
      alreadySentForStep: already,
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
