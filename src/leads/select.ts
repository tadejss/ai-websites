import { getLeadPriority, type LeadPriority } from "./priority";
import {
  leadMatchesIndustry,
  type LeadIndustryId,
} from "./industry-filter";
import { matchesRegion } from "./region";
import { readAllLeads, type LeadRecord } from "./store";

export type LeadFilters = {
  statuses?: string[];
  priorities?: LeadPriority[];
  withoutWebsiteOnly?: boolean;
  industry?: LeadIndustryId;
  region?: string;
};

const PRIORITY_ORDER: Record<LeadPriority, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
};

export function selectLeads(filters: LeadFilters): LeadRecord[] {
  return readAllLeads()
    .filter((lead) => {
      if (filters.statuses && !filters.statuses.includes(lead.status ?? "")) {
        return false;
      }

      if (
        filters.priorities &&
        !filters.priorities.includes(getLeadPriority(lead))
      ) {
        return false;
      }

      if (filters.withoutWebsiteOnly && lead.existingWebsite?.trim()) {
        return false;
      }

      if (!leadMatchesIndustry(filters.industry, lead)) {
        return false;
      }

      if (!matchesRegion(filters.region, lead.address)) {
        return false;
      }

      return true;
    })
    .sort(
      (a, b) =>
        PRIORITY_ORDER[getLeadPriority(a)] - PRIORITY_ORDER[getLeadPriority(b)],
    );
}
