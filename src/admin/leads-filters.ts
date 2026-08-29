import { getOutreachStatusLabel } from "@/outreach/eligibility";
import { LEAD_STATUSES } from "@/leads/statuses";
import type { LeadRecord } from "@/leads/store";

/** Outreach buckets shown in admin (matches getOutreachStatusLabel + DB customer). */
export const ADMIN_OUTREACH_FILTERS = [
  { value: "ready", label: "Ready to send" },
  { value: "missing_email", label: "Missing email" },
  { value: "no_website", label: "No website" },
  { value: "awaiting_followup_1", label: "Awaiting follow-up #1" },
  { value: "awaiting_followup_2", label: "Awaiting follow-up #2" },
  { value: "sequence_complete", label: "Sequence complete" },
  { value: "customer", label: "Customer" },
  { value: "replied", label: "Replied" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not interested" },
  { value: "rejected", label: "Rejected" },
  { value: "do_not_contact", label: "Do not contact" },
] as const;

export type AdminOutreachFilter = (typeof ADMIN_OUTREACH_FILTERS)[number]["value"];

export const ADMIN_STATUS_FILTERS = LEAD_STATUSES.map((status) => ({
  value: status,
  label: status.replaceAll("_", " "),
}));

export type AdminLeadRow = {
  lead: LeadRecord;
  isCustomer: boolean;
  displayStatus: string;
  outreachLabel: string;
};

export function resolveAdminLeadStatus(
  lead: LeadRecord,
  isCustomer: boolean,
): string {
  if (isCustomer) {
    return "customer";
  }

  return lead.status ?? "";
}

export function resolveAdminOutreachLabel(
  lead: LeadRecord,
  isCustomer: boolean,
): string {
  if (isCustomer) {
    return "customer";
  }

  return getOutreachStatusLabel(lead);
}

export function buildAdminLeadRows(
  leads: LeadRecord[],
  customerSlugs: Set<string>,
): AdminLeadRow[] {
  return leads.map((lead) => {
    const isCustomer = customerSlugs.has(lead.slug);
    return {
      lead,
      isCustomer,
      displayStatus: resolveAdminLeadStatus(lead, isCustomer),
      outreachLabel: resolveAdminOutreachLabel(lead, isCustomer),
    };
  });
}

export type AdminLeadListFilters = {
  status?: string;
  outreach?: string;
};

export function filterAdminLeadRows(
  rows: AdminLeadRow[],
  filters: AdminLeadListFilters,
): AdminLeadRow[] {
  return rows.filter((row) => {
    if (filters.status && row.displayStatus !== filters.status) {
      return false;
    }

    if (filters.outreach && row.outreachLabel !== filters.outreach) {
      return false;
    }

    return true;
  });
}

export function isAdminOutreachFilter(
  value: string | undefined,
): value is AdminOutreachFilter {
  if (!value) {
    return false;
  }

  return ADMIN_OUTREACH_FILTERS.some((option) => option.value === value);
}

export function isAdminStatusFilter(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return (LEAD_STATUSES as readonly string[]).includes(value);
}

export function adminLeadsFilterHref(
  filters: AdminLeadListFilters,
): string {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.outreach) {
    params.set("outreach", filters.outreach);
  }

  const query = params.toString();
  return query ? `/admin/leads?${query}` : "/admin/leads";
}
