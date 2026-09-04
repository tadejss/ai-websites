import { createHash } from "node:crypto";
import { isCustomer } from "@/customers/store";
import { getDemoUrl } from "@/leads/demo-url";
import type { LeadRecord } from "@/leads/store";
import { evaluateSmsEligibility } from "./eligibility";
import { getSmsConfig } from "./config";
import {
  countDailySmsBudgetUsed,
  getSmsLeadState,
  hasActiveOrSentStep,
  insertQueuedMessage,
  isSmsOptedOut,
  upsertSmsLeadState,
} from "./store";
import { renderSms } from "./templates";
import { smsCompanyDisplayName } from "./company-name";
import { normalizeSlovenianPhone } from "./phone";
import type { SmsMessageRecord, SmsStep } from "./types";

export type EnqueueSmsResult =
  | { ok: true; message: SmsMessageRecord; alreadyQueued: boolean }
  | { ok: false; error: string };

function stableMessageId(slug: string, step: SmsStep): string {
  const digest = createHash("sha256").update(`${slug}:${step}`).digest("hex").slice(0, 16);
  return `sms_${slug}_${step}_${digest}`;
}

function smsContext(lead: LeadRecord, step: SmsStep) {
  return {
    companyName: smsCompanyDisplayName(
      lead.companyName,
      lead.slug,
    ),
    demoUrl: getDemoUrl(lead),
    hasExistingWebsite: Boolean(lead.existingWebsite?.trim()),
    step,
  };
}

export async function enqueueSmsForLead(input: {
  lead: LeadRecord;
  step: SmsStep;
  force?: boolean;
}): Promise<EnqueueSmsResult> {
  const { lead, step, force = false } = input;
  const already = await hasActiveOrSentStep(lead.slug, step);
  const customer = await isCustomer(lead.slug);
  const state = await getSmsLeadState(lead.slug);
  const phonePreview = normalizeSlovenianPhone(lead.phone);
  const globallyOptedOut = phonePreview.ok
    ? await isSmsOptedOut(phonePreview.e164)
    : false;
  const eligibility = evaluateSmsEligibility({
    lead,
    isCustomer: customer,
    state,
    step,
    alreadySentForStep: already && !force,
    globallyOptedOut,
  });

  if (!eligibility.ok) {
    return { ok: false, error: eligibility.reason };
  }

  if (already && !force) {
    return { ok: false, error: `SMS step "${step}" already queued or sent` };
  }

  const budgetUsed = await countDailySmsBudgetUsed();
  if (budgetUsed >= getSmsConfig().dailyLimit && !force) {
    return { ok: false, error: "Daily SMS limit reached" };
  }

  // Re-check opt-out immediately before write (inbound may race).
  const freshState = await getSmsLeadState(lead.slug);
  if (
    (await isSmsOptedOut(eligibility.phone)) ||
    freshState?.smsStatus === "opted_out" ||
    freshState?.smsAllowed === false
  ) {
    return { ok: false, error: "Lead opted out of SMS" };
  }

  const rendered = renderSms(smsContext(lead, step));
  const messageId = force
    ? `sms_${lead.slug}_${step}_${Date.now().toString(36)}`
    : stableMessageId(lead.slug, step);

  try {
    const message = await insertQueuedMessage({
      messageId,
      slug: lead.slug,
      toPhone: eligibility.phone,
      toPhoneRaw: lead.phone ?? null,
      body: rendered.text,
      step,
    });

    await upsertSmsLeadState({
      slug: lead.slug,
      normalizedPhone: eligibility.phone,
      smsStatus: "queued",
      // Never re-enable SMS on enqueue; preserve prior opt-out.
      smsAllowed: freshState?.smsAllowed ?? true,
      smsMessageId: message.messageId,
      smsLastError: null,
    });

    return { ok: true, message, alreadyQueued: false };
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    if (text.includes("sms_messages_message_id") || text.includes("unique") || text.includes("duplicate")) {
      return { ok: false, error: "Duplicate SMS already queued for this lead and step" };
    }
    return { ok: false, error: text };
  }
}
