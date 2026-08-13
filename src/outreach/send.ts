import type { ContactHistoryEntry, OutreachStep } from "@/leads/outreach-types";
import { statusAfterOutreachStep } from "@/leads/statuses";
import { patchLead, readLead, type LeadRecord } from "@/leads/store";
import { buildEmailTemplateContext } from "./build-context";
import { getOutreachConfig } from "./config";
import { getDueOutreachStep, getNextFollowUpAt, wasStepAlreadySent } from "./eligibility";
import { logOutreach } from "./logger";
import { sendEmail } from "./resend";
import { renderOutreachEmail } from "./templates";
import { normalizeEmail } from "./validate-email";

export type SendOutreachOptions = {
  step?: OutreachStep;
  force?: boolean;
  dryRun?: boolean;
};

export type SendOutreachResult =
  | {
      ok: true;
      slug: string;
      step: OutreachStep;
      messageId: string;
      dryRun: boolean;
      recipient: string;
      subject: string;
    }
  | {
      ok: false;
      slug: string;
      error: string;
      skipped?: boolean;
    };

function timestampFieldForStep(step: OutreachStep): keyof NonNullable<LeadRecord["outreach"]> {
  switch (step) {
    case "initial":
      return "initialSentAt";
    case "followup_1":
      return "followup1SentAt";
    case "followup_2":
      return "followup2SentAt";
  }
}

function recordSuccessfulSend(
  lead: LeadRecord,
  step: OutreachStep,
  messageId: string,
  subject: string,
  dryRun: boolean,
): LeadRecord | null {
  const now = new Date().toISOString();
  const outreach = lead.outreach ?? {};
  const timestampField = timestampFieldForStep(step);
  const messageIds = [...(outreach.messageIds ?? [])];

  if (!dryRun && !messageIds.includes(messageId)) {
    messageIds.push(messageId);
  }

  const historyEntry: ContactHistoryEntry = {
    step,
    sentAt: now,
    messageId: dryRun ? undefined : messageId,
    subject,
    dryRun,
  };

  const contactHistory = [...(lead.contactHistory ?? []), historyEntry];
  const emailsSent = (outreach.emailsSent ?? 0) + (dryRun ? 0 : 1);

  const updatedOutreach = {
    ...outreach,
    [timestampField]: dryRun ? outreach[timestampField] : now,
    lastSentAt: dryRun ? outreach.lastSentAt : now,
    lastMessageId: dryRun ? outreach.lastMessageId : messageId,
    messageIds,
    emailsSent,
    lastError: undefined,
    nextFollowUpAt: getNextFollowUpAt(
      {
        ...lead,
        outreach: {
          ...outreach,
          [timestampField]: dryRun ? outreach[timestampField] : now,
        },
        status: dryRun ? lead.status : statusAfterOutreachStep(step),
      },
    ) ?? undefined,
    deliveryStatus: dryRun ? outreach.deliveryStatus : ("sent" as const),
  };

  return patchLead(lead.slug, {
    email: lead.email || undefined,
    status: dryRun ? lead.status : statusAfterOutreachStep(step),
    outreach: updatedOutreach,
    contactHistory,
  });
}

function recordFailedSend(lead: LeadRecord, error: string): void {
  patchLead(lead.slug, {
    outreach: {
      ...lead.outreach,
      lastError: error,
    },
  });
}

export async function sendOutreachToLead(
  slug: string,
  options: SendOutreachOptions = {},
): Promise<SendOutreachResult> {
  const lead = readLead(slug);

  if (!lead) {
    return { ok: false, slug, error: "Lead not found" };
  }

  const config = getOutreachConfig();
  const dryRun = options.dryRun ?? config.dryRun;
  const step = options.step ?? getDueOutreachStep(lead);

  if (!step) {
    return { ok: false, slug, error: "No outreach step is due", skipped: true };
  }

  if (!options.force && wasStepAlreadySent(lead, step)) {
    return {
      ok: false,
      slug,
      error: `Step "${step}" was already sent`,
      skipped: true,
    };
  }

  const context = buildEmailTemplateContext(lead);

  if (!context) {
    return {
      ok: false,
      slug,
      error: "Missing email or demo URL for lead",
      skipped: true,
    };
  }

  const rendered = renderOutreachEmail(step, context);
  const recipient = normalizeEmail(context.recipientEmail);

  logOutreach({
    level: "info",
    event: dryRun ? "would_send" : "sending",
    slug,
    step,
    recipient,
    subject: rendered.subject,
    dryRun,
  });

  const sendResult = await sendEmail({
    to: recipient,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    tags: [
      { name: "lead_slug", value: slug },
      { name: "outreach_step", value: step },
    ],
  });

  if (!sendResult.ok) {
    if (!dryRun) {
      recordFailedSend(lead, sendResult.error);
    }

    logOutreach({
      level: "error",
      event: "send_failed",
      slug,
      step,
      recipient,
      subject: rendered.subject,
      details: { error: sendResult.error },
    });

    return { ok: false, slug, error: sendResult.error };
  }

  if (!dryRun) {
    const freshLead = readLead(slug);

    if (!freshLead) {
      return { ok: false, slug, error: "Lead disappeared during send" };
    }

    if (!options.force && wasStepAlreadySent(freshLead, step)) {
      return {
        ok: false,
        slug,
        error: `Step "${step}" was already sent by another process`,
        skipped: true,
      };
    }

    const updated = recordSuccessfulSend(
      { ...freshLead, email: freshLead.email || recipient },
      step,
      sendResult.messageId,
      rendered.subject,
      false,
    );

    if (!updated) {
      return { ok: false, slug, error: "Failed to update lead after send" };
    }
  }

  logOutreach({
    level: "info",
    event: dryRun ? "dry_run_complete" : "send_complete",
    slug,
    step,
    messageId: sendResult.messageId,
    recipient,
    subject: rendered.subject,
    dryRun,
  });

  return {
    ok: true,
    slug,
    step,
    messageId: sendResult.messageId,
    dryRun,
    recipient,
    subject: rendered.subject,
  };
}
