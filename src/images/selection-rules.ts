/**
 * Permanent image-selection rules for Slovenian SME demo sites.
 *
 * Used by search-plan prompts, pool query construction, and slot assignment
 * so market/trade/section mistakes do not re-enter the library.
 */

import type { ImagePoolCategoryId } from "./image-pool-category";
import type { ImageSlot } from "./types";

/** Locale / market constraints for SI-facing stock photography. */
export const LOCAL_MARKET_RULES = [
  "Prefer Slovenian / EU / Central-European visual context.",
  "Avoid foreign place names, domains, and prominent foreign commercial signage.",
  "Avoid Cyrillic or clearly non-EU commercial signage.",
  "Avoid US-specific infrastructure and road cues (e.g. double yellow lines, US highway furniture).",
  "Where electrical fixtures are visible, prefer EU Type C/F (Schuko); avoid UK Type G and North-American Type B outlets.",
  "Avoid prominently visible foreign license plates.",
  "Avoid national PPE / safety branding that creates strong non-EU cues.",
  "Prefer neutral, unbranded environments when possible.",
  "Each demo site must receive at least 6 stock photos total (hero + services + gallery items).",
  "Photos may be shared across multiple demos in the same profession/category; identical stock across demos is allowed.",
  "Asset usageCount is a soft ranking signal only (prefer lower usage for rotation) — not a hard exclusivity limit.",
  "Uniqueness of photos across different demos is not a requirement.",
] as const;

/**
 * People photographs are evaluated by setting and commercial fit — not by
 * demographic identity.
 */
export const PEOPLE_CONTEXT_RULES = [
  "Do not reject people photographs based on demographic identity.",
  "Evaluate people photos by setting, styling, commercial context, cultural cues, and suitability for the Slovenian target market.",
] as const;

/** What each pool category should visually depict. */
export const TRADE_VISUAL_EXPECTATIONS: Record<ImagePoolCategoryId, string> = {
  "nohti-pedikura": "nail salon / manicure / pedicure treatment or tools",
  "maserji-wellness": "massage / spa / wellness treatment room or therapy",
  vulkanizerji: "tires, wheels, tire change, or vulcanizing equipment",
  "avtokleparji-licarji": "auto body repair, dent work, or paint booth",
  avtomehaniki: "vehicle repair / engine service / auto workshop",
  frizerji: "hair salon interior, styling, or cutting",
  kozmeticarji: "beauty / skincare / facial treatment setting",
  "vodovodarji-ogrevanje": "plumbing, heating, HVAC, pipes, or sanitary install",
  elektricarji: "electrical installation, panels, wiring, or lighting install",
  keramicarji: "tile installation, bathroom/kitchen tiling work",
  slikopleskarji: "interior/exterior painting or painter at work",
  suhomontazerji: "drywall / gypsum board installation",
  "mizarji-tesarji": "carpentry / woodworking / joinery",
  "parketarji-talne-obloge": "hardwood / laminate / flooring installation",
  gradbinci: "construction / renovation building work",
  "cistilni-servisi": "professional cleaning activity or cleaning equipment in use",
};

export const SECTION_PURPOSE_RULES: Record<ImageSlot, string> = {
  hero:
    "Hero: primary brand visual — tradesperson at work or clear trade environment that reads at a glance.",
  services:
    "Services: supporting proof of craft — tools, detail, process, or a second distinct trade scene (not a duplicate of hero).",
};

/** Appended to Gemini image-plan system prompts. */
export function imageSelectionPromptBlock(): string {
  const tradeLines = Object.entries(TRADE_VISUAL_EXPECTATIONS)
    .map(([id, expectation]) => `- ${id}: ${expectation}`)
    .join("\n");

  return [
    "Slovenian local-market image rules:",
    ...LOCAL_MARKET_RULES.map((rule) => `- ${rule}`),
    "",
    "People / casting:",
    ...PEOPLE_CONTEXT_RULES.map((rule) => `- ${rule}`),
    "",
    "Trade matching (queries must depict the correct trade; do not use a generic pretty photo for an unrelated industry):",
    tradeLines,
    "",
    "Section purpose:",
    `- ${SECTION_PURPOSE_RULES.hero}`,
    `- ${SECTION_PURPOSE_RULES.services}`,
    "- Hero and services queries must request visually distinct scenes.",
    "- Never reuse the same photo concept for both slots when alternatives exist.",
  ].join("\n");
}

/** Locale bias tokens appended to pool search queries. */
const LOCALE_QUERY_HINT = "european commercial";

/**
 * Soften pool queries toward EU/neutral commercial contexts without
 * changing the trade intent of the base query.
 */
export function applyLocaleQueryHint(query: string): string {
  const normalized = query.trim().replace(/\s+/g, " ");
  if (/european|eu\b|schuko|central.?europe/i.test(normalized)) {
    return normalized;
  }
  return `${normalized} ${LOCALE_QUERY_HINT}`;
}

/** Soft keyword rejects for AI-generated or pool queries (pre-download). */
const REJECT_QUERY_PATTERNS: RegExp[] = [
  /\busa\b|\bunited states\b|\bamerican highway\b/i,
  /\buk plug\b|\btype g\b|\bbritish socket\b/i,
  /\bnema\b|\btype b outlet\b|\bus outlet\b/i,
  /\bcyrillic\b|\bmoscow\b|\brussian storefront\b/i,
];

export function queryViolatesMarketRules(query: string): boolean {
  return REJECT_QUERY_PATTERNS.some((pattern) => pattern.test(query));
}

/**
 * Prefer two distinct asset keys for hero/services. Returns [hero, services]
 * and never intentionally duplicates when a second eligible key exists.
 */
export function pickDistinctSlotKeys(
  keys: string[],
): { heroKey: string; servicesKey: string } | undefined {
  if (keys.length === 0) {
    return undefined;
  }
  const heroKey = keys[0]!;
  const servicesKey = keys.find((key) => key !== heroKey) ?? keys[1];
  if (!servicesKey) {
    return undefined;
  }
  return { heroKey, servicesKey };
}
