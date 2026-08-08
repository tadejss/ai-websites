import type { SiteConfig } from "@/content/types/site";
import type { BusinessInput } from "./types";

export type UnsupportedClaim = {
  field: string;
  value: string;
  reason: string;
};

const PERCENTAGE_PATTERN = /\d+\s*%/;
const EXPERIENCE_PATTERN = /\b\d+\s*\+?\s*(let|leta|letih|leti)\b/i;
const COUNT_PATTERN =
  /\b\d+\s*\+?\s*(strank|strankami|kupcev|zadovoljnih|ocen|mnenj|projektov)\b/i;
const ALWAYS_OPEN_PATTERN = /24\s*\/\s*7|non-?stop|24\s*ur\b/i;

const UNSUPPORTED_WORDS = [
  "nagrajen",
  "nagrada",
  "certificiran",
  "certifikat",
  "garancija",
  "garantiramo",
  "jamstvo",
  "award",
  "certified",
  "guarantee",
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function collectCopy(config: SiteConfig): Array<[string, string]> {
  const entries: Array<[string, string]> = [
    ["brand.prefix", config.brand.prefix],
    ["brand.highlight", config.brand.highlight],
    ["metadata.title", config.metadata.title],
    ["metadata.description", config.metadata.description],
    ["nav.cta", config.nav.cta],
    ["hero.badge", config.hero.badge],
    ["hero.title", config.hero.title],
    ["hero.titleHighlight", config.hero.titleHighlight],
    ["hero.description", config.hero.description],
    ["hero.primaryCta", config.hero.primaryCta],
    ["hero.secondaryCta", config.hero.secondaryCta],
    ["services.eyebrow", config.services.eyebrow],
    ["services.title", config.services.title],
    ["services.description", config.services.description],
    ["whyChooseUs.eyebrow", config.whyChooseUs.eyebrow],
    ["whyChooseUs.title", config.whyChooseUs.title],
    ["whyChooseUs.description", config.whyChooseUs.description],
    ["contact.eyebrow", config.contact.eyebrow],
    ["contact.title", config.contact.title],
    ["contact.description", config.contact.description],
    ["footer.rights", config.footer.rights],
  ];

  config.nav.links.forEach((link, index) => {
    entries.push([`nav.links[${index}].label`, link.label]);
  });

  config.hero.stats.forEach((stat, index) => {
    entries.push([`hero.stats[${index}].value`, stat.value]);
    entries.push([`hero.stats[${index}].label`, stat.label]);
  });

  config.services.items.forEach((item, index) => {
    entries.push([`services.items[${index}].title`, item.title]);
    entries.push([`services.items[${index}].description`, item.description]);
  });

  config.whyChooseUs.highlights.forEach((highlight, index) => {
    entries.push([`whyChooseUs.highlights[${index}]`, highlight]);
  });

  config.whyChooseUs.benefits.forEach((benefit, index) => {
    entries.push([`whyChooseUs.benefits[${index}].stat`, benefit.stat]);
    entries.push([`whyChooseUs.benefits[${index}].label`, benefit.label]);
    entries.push([
      `whyChooseUs.benefits[${index}].description`,
      benefit.description,
    ]);
  });

  config.contact.items.forEach((item, index) => {
    entries.push([`contact.items[${index}].label`, item.label]);
  });

  return entries;
}

export function findUnsupportedClaims(
  config: SiteConfig,
  input: BusinessInput,
): UnsupportedClaim[] {
  const source = normalize(JSON.stringify(input));
  const hasExperience = Boolean(input.yearsExperience?.trim());
  const alwaysOpen = /24/.test(input.openingHours ?? "");

  const claims: UnsupportedClaim[] = [];

  for (const [field, value] of collectCopy(config)) {
    if (!value) {
      continue;
    }

    const normalized = normalize(value);
    const inSource = source.includes(normalized);

    if (PERCENTAGE_PATTERN.test(value) && !inSource) {
      claims.push({
        field,
        value,
        reason: "percentage claim is not supported by the business data",
      });
      continue;
    }

    if (EXPERIENCE_PATTERN.test(value) && !hasExperience) {
      claims.push({
        field,
        value,
        reason: "years of experience are not known for this business",
      });
      continue;
    }

    if (COUNT_PATTERN.test(value) && !inSource) {
      claims.push({
        field,
        value,
        reason: "customer or review count is not supported by the business data",
      });
      continue;
    }

    if (ALWAYS_OPEN_PATTERN.test(value) && !alwaysOpen) {
      claims.push({
        field,
        value,
        reason: "opening hours do not support an always-open claim",
      });
      continue;
    }

    const unsupportedWord = UNSUPPORTED_WORDS.find(
      (word) => normalized.includes(word) && !source.includes(word),
    );

    if (unsupportedWord) {
      claims.push({
        field,
        value,
        reason: `"${unsupportedWord}" is not supported by the business data`,
      });
    }
  }

  return claims;
}

export function describeClaims(claims: UnsupportedClaim[]): string {
  return claims
    .map((claim) => `${claim.field}: "${claim.value}" - ${claim.reason}`)
    .join("\n");
}

export function validateClaims(
  config: SiteConfig,
  input: BusinessInput,
): SiteConfig {
  const claims = findUnsupportedClaims(config, input);

  if (claims.length > 0) {
    throw new Error(
      `Generated copy contains unsupported claims:\n${describeClaims(claims)}`,
    );
  }

  return config;
}
