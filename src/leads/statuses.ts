export const LEAD_STATUSES = [
  "generated",
  "contacted",
  "interested",
  "customer",
  "rejected",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}
