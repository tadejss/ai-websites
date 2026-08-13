import { clientSiteExists } from "@/leads/client-exists";
import type { OutreachStep } from "@/leads/outreach-types";
import { resolveLeadEmail } from "@/leads/resolve-email";
import { isOutreachSuppressed } from "@/leads/statuses";
import type { LeadRecord } from "@/leads/store";
import { getOutreachConfig } from "./config";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysSince(isoDate: string | undefined, now = Date.now()): number | null {
  if (!isoDate) {
    return null;
  }

  const timestamp = Date.parse(isoDate);

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return (now - timestamp) / MS_PER_DAY;
}

function stepTimestamp(lead: LeadRecord, step: OutreachStep): string | undefined {
  switch (step) {
    case "initial":
      return lead.outreach?.initialSentAt;
    case "followup_1":
      return lead.outreach?.followup1SentAt;
    case "followup_2":
      return lead.outreach?.followup2SentAt;
  }
}

export function hasWebsiteReady(lead: LeadRecord): boolean {
  return lead.status === "generated" || clientSiteExists(lead.slug);
}

export function isLeadEligibleForOutreach(lead: LeadRecord): boolean {
  if (isOutreachSuppressed(lead.status)) {
    return false;
  }

  if (!hasWebsiteReady(lead)) {
    return false;
  }

  if (!clientSiteExists(lead.slug)) {
    return false;
  }

  if (!resolveLeadEmail(lead)) {
    return false;
  }

  return true;
}

export function getDueOutreachStep(
  lead: LeadRecord,
  now = Date.now(),
): OutreachStep | null {
  if (!isLeadEligibleForOutreach(lead)) {
    return null;
  }

  const config = getOutreachConfig();
  const outreach = lead.outreach;

  if (!outreach?.initialSentAt) {
    return lead.status === "generated" ? "initial" : null;
  }

  if (!outreach.followup1SentAt) {
    const elapsed = daysSince(outreach.initialSentAt, now);

    if (elapsed !== null && elapsed >= config.followup1Days) {
      return "followup_1";
    }

    return null;
  }

  if (!outreach.followup2SentAt) {
    const elapsed = daysSince(outreach.followup1SentAt, now);

    if (elapsed !== null && elapsed >= config.followup2Days) {
      return "followup_2";
    }

    return null;
  }

  return null;
}

export function getNextFollowUpAt(lead: LeadRecord, now = Date.now()): string | null {
  const outreach = lead.outreach;
  const config = getOutreachConfig();

  if (!isLeadEligibleForOutreach(lead)) {
    return null;
  }

  if (!outreach?.initialSentAt) {
    return new Date(now).toISOString();
  }

  if (!outreach.followup1SentAt) {
    const initialAt = Date.parse(outreach.initialSentAt);

    if (Number.isNaN(initialAt)) {
      return null;
    }

    return new Date(initialAt + config.followup1Days * MS_PER_DAY).toISOString();
  }

  if (!outreach.followup2SentAt) {
    const followup1At = Date.parse(outreach.followup1SentAt);

    if (Number.isNaN(followup1At)) {
      return null;
    }

    return new Date(followup1At + config.followup2Days * MS_PER_DAY).toISOString();
  }

  return null;
}

export function wasStepAlreadySent(lead: LeadRecord, step: OutreachStep): boolean {
  return Boolean(stepTimestamp(lead, step));
}

export function getOutreachStatusLabel(lead: LeadRecord): string {
  if (isOutreachSuppressed(lead.status)) {
    return lead.status ?? "unknown";
  }

  if (!resolveLeadEmail(lead)) {
    return "missing_email";
  }

  if (!clientSiteExists(lead.slug)) {
    return "no_website";
  }

  if (!lead.outreach?.initialSentAt) {
    return "ready";
  }

  if (!lead.outreach.followup1SentAt) {
    return "awaiting_followup_1";
  }

  if (!lead.outreach.followup2SentAt) {
    return "awaiting_followup_2";
  }

  return "sequence_complete";
}
