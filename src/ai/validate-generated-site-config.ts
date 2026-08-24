import type { SiteConfig } from "@/content/types/site";
import { collectVisibleCopy } from "./validate-claims";

const MAX_COPY_LENGTH = 400;
const MAX_STAT_LENGTH = 40;

type Bounds = { min: number; max: number };

const SECTION_BOUNDS: Record<string, Bounds> = {
  "nav.links": { min: 3, max: 4 },
  "hero.stats": { min: 4, max: 4 },
  "services.items": { min: 3, max: 6 },
  "whyChooseUs.highlights": { min: 3, max: 4 },
  "whyChooseUs.benefits": { min: 3, max: 4 },
  "contact.items": { min: 1, max: 4 },
};

function sectionSizes(config: SiteConfig): Record<string, number> {
  return {
    "nav.links": config.nav.links.length,
    "hero.stats": config.hero.stats.length,
    "services.items": config.services.items.length,
    "whyChooseUs.highlights": config.whyChooseUs.highlights.length,
    "whyChooseUs.benefits": config.whyChooseUs.benefits.length,
    "contact.items": config.contact.items.length,
  };
}

function isStatField(field: string): boolean {
  return field.endsWith(".stat") || field.startsWith("hero.stats[");
}

export function findQualityProblems(config: SiteConfig): string[] {
  const problems: string[] = [];
  const sizes = sectionSizes(config);

  for (const [section, bounds] of Object.entries(SECTION_BOUNDS)) {
    const size = sizes[section];

    if (size < bounds.min || size > bounds.max) {
      problems.push(
        `${section} has ${size} items, expected between ${bounds.min} and ${bounds.max}`,
      );
    }
  }

  for (const [field, value] of collectVisibleCopy(config)) {
    if (!value.trim()) {
      problems.push(`${field} is empty`);
      continue;
    }

    const maxLength = isStatField(field) ? MAX_STAT_LENGTH : MAX_COPY_LENGTH;

    if (value.length > maxLength) {
      problems.push(
        `${field} is ${value.length} characters, expected at most ${maxLength}`,
      );
    }
  }

  return problems;
}

export function validateGeneratedSiteConfig(config: SiteConfig): SiteConfig {
  const problems = findQualityProblems(config);

  if (problems.length > 0) {
    throw new Error(
      `Generated site config is incomplete:\n${problems.join("\n")}`,
    );
  }

  return config;
}
