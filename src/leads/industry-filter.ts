export const LEAD_INDUSTRY_IDS = [
  "frizer",
  "beauty",
  "keramicar",
  "elektro",
  "vulkanizer",
  "avtoservis",
  "vodovod",
  "slikopleskar",
  "gradbenistvo",
  "mizarstvo",
  "kljucavnicar",
  "ciscenje",
  "vrtnarstvo",
] as const;

export type LeadIndustryId = (typeof LEAD_INDUSTRY_IDS)[number];

const PATTERNS: Record<LeadIndustryId, RegExp> = {
  frizer: /friz|salon|hair|barber|brivnic/i,
  beauty: /beauty|kozmet|nail|noht|pedik|manik|estet/i,
  keramicar:
    /keramič|keramic|tile|tlakov|polaganje\s+keramik|ploščic|ploscic|keramika|kamna/i,
  elektro: /elektro|električ|elektric|electrician/i,
  vulkanizer: /vulkaniz|gumar|pnevmatik|tire|avtovulkan/i,
  avtoservis: /avtoservis|avtomehan|mehanik|auto\s*repair|servis\s+avto/i,
  vodovod: /vodovod|vodoinštal|vodoinstal|klepar|ogrevan|kuril|plumbing|instalater/i,
  slikopleskar: /slikopleskar|fasader|plasterer|painter|barvanje|fasad/i,
  gradbenistvo: /gradben|renovac|zidar|adaptation|gradnja/i,
  mizarstvo: /mizar|tesar|furniture|pohišt|pohist/i,
  kljucavnicar: /ključavnič|kljucavnic|locksmith|ključavni/i,
  ciscenje: /čiščenj|ciscenj|cleaning|čistiln|cistiln/i,
  vrtnarstvo: /vrtnar|landscap|hortikul|košnja|kosnja|urejanje\s+okolice/i,
};

/** Categories that are not ICP for a simple local-business website. */
export const ICP_EXCLUDE_NAME_PATTERN =
  /pekarna|gostil|restavrac|restoran|bar\b|pub\b|kavarn|café|cafe|hotel|hostel|airbnb|apartma|turiz|turisti|spa\s+hotel|trgovina|market|spar|mercator|lidl|hofer|e-?commerce|spletna\s+trgovina|\bšola\b|\bsola\b|vzgojitelj|trenerstvo|fitnes|gym\b/i;

export function isLeadIndustryId(value: string): value is LeadIndustryId {
  return (LEAD_INDUSTRY_IDS as readonly string[]).includes(value);
}

export function leadMatchesIndustry(
  industryId: LeadIndustryId | undefined,
  lead: { industry?: string; companyName?: string; sourceQuery?: string },
): boolean {
  if (!industryId) {
    return true;
  }

  return PATTERNS[industryId].test(
    `${lead.industry ?? ""} ${lead.companyName ?? ""} ${lead.sourceQuery ?? ""}`,
  );
}

/**
 * Noise names to drop during discovery for a given industry
 * (exclude hospitality/retail plus cross-industry trades).
 */
export function discoveryNoisePattern(
  _industryId: LeadIndustryId | undefined,
): RegExp {
  return ICP_EXCLUDE_NAME_PATTERN;
}
