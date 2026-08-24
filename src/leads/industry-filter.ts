export const LEAD_INDUSTRY_IDS = [
  "frizer",
  "keramicar",
  "elektro",
  "vulkanizer",
] as const;

export type LeadIndustryId = (typeof LEAD_INDUSTRY_IDS)[number];

const PATTERNS: Record<LeadIndustryId, RegExp> = {
  frizer: /friz|salon|hair|barber|beauty|kozmet|nail|noht/i,
  keramicar: /keramič|keramic|tile|tlakov|polaganje\s+keramik/i,
  elektro: /elektro|električ|elektric|electrician/i,
  vulkanizer: /vulkaniz|gumar|pnevmatik|tire|avtovulkan/i,
};

export function isLeadIndustryId(value: string): value is LeadIndustryId {
  return (LEAD_INDUSTRY_IDS as readonly string[]).includes(value);
}

export function leadMatchesIndustry(
  industryId: LeadIndustryId | undefined,
  lead: { industry?: string; companyName?: string },
): boolean {
  if (!industryId) {
    return true;
  }

  return PATTERNS[industryId].test(
    `${lead.industry ?? ""} ${lead.companyName ?? ""}`,
  );
}
