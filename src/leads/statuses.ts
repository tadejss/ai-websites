export const LEAD_STATUSES = [
  "discovered",
  "generated",
  "contacted",
  "followup_1",
  "followup_2",
  "replied",
  "interested",
  "not_interested",
  "customer",
  "rejected",
  "do_not_contact",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Statuses where automated outreach must never run. */
export const OUTREACH_SUPPRESSED_STATUSES: readonly LeadStatus[] = [
  "replied",
  "interested",
  "not_interested",
  "rejected",
  "customer",
  "do_not_contact",
] as const;

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

export function isOutreachSuppressed(status: string | undefined): boolean {
  if (!status) {
    return false;
  }

  return (OUTREACH_SUPPRESSED_STATUSES as readonly string[]).includes(status);
}

/** Status after a successful outreach step is sent. */
export function statusAfterOutreachStep(step: "initial" | "followup_1" | "followup_2"): LeadStatus {
  switch (step) {
    case "initial":
      return "contacted";
    case "followup_1":
      return "followup_1";
    case "followup_2":
      return "followup_2";
  }
}
