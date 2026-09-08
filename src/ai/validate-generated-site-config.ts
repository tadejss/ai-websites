import type { SiteConfig } from "@/content/types/site";
import { collectVisibleCopy } from "./validate-claims";

const MAX_COPY_LENGTH = 400;
const MAX_STAT_LENGTH = 40;

type Bounds = { min: number; max: number };

const LEGACY_BOUNDS: Record<string, Bounds> = {
  "nav.links": { min: 3, max: 5 },
  "services.items": { min: 3, max: 6 },
  "whyChooseUs.highlights": { min: 3, max: 4 },
  "whyChooseUs.benefits": { min: 3, max: 4 },
  "contact.items": { min: 1, max: 4 },
  "pricing.items": { min: 4, max: 8 },
};

const TEMPLATE_2026_BOUNDS: Record<string, Bounds> = {
  "nav.links": { min: 2, max: 6 },
  "services.items": { min: 3, max: 6 },
  "contact.items": { min: 1, max: 4 },
  "pricing.items": { min: 3, max: 6 },
};

function sectionSizes(config: SiteConfig): Record<string, number> {
  return {
    "nav.links": config.nav.links.length,
    "services.items": config.services.items.length,
    "whyChooseUs.highlights": config.whyChooseUs.highlights.length,
    "whyChooseUs.benefits": config.whyChooseUs.benefits.length,
    "contact.items": config.contact.items.length,
    "pricing.items": config.pricing?.items.length ?? 0,
  };
}

function isStatField(field: string): boolean {
  return field.endsWith(".stat") || field.startsWith("hero.stats[");
}

export type GeneratedValidationOptions = {
  /** New template pipeline: no whyChooseUs bounds; pricing 1–3. */
  mode?: "legacy" | "template2026";
};

export function findQualityProblems(
  config: SiteConfig,
  options: GeneratedValidationOptions = {},
): string[] {
  const problems: string[] = [];
  const sizes = sectionSizes(config);
  const mode = options.mode ?? "legacy";
  const boundsTable =
    mode === "template2026" ? TEMPLATE_2026_BOUNDS : LEGACY_BOUNDS;

  if (!config.pricing) {
    problems.push("pricing section is required for generated site configs");
  } else if (!config.pricing.disclaimer?.trim()) {
    problems.push("pricing.disclaimer is required");
  }

  for (const [section, bounds] of Object.entries(boundsTable)) {
    if (section === "pricing.items" && !config.pricing) {
      continue;
    }

    const size = sizes[section];

    if (size < bounds.min || size > bounds.max) {
      problems.push(
        `${section} has ${size} items, expected between ${bounds.min} and ${bounds.max}`,
      );
    }
  }

  for (const [field, value] of collectVisibleCopy(config)) {
    if (mode === "template2026" && field.startsWith("whyChooseUs.")) {
      continue;
    }

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

export function validateGeneratedSiteConfig(
  config: SiteConfig,
  options: GeneratedValidationOptions = {},
): SiteConfig {
  const problems = findQualityProblems(config, options);

  if (problems.length > 0) {
    throw new Error(
      `Generated site config is incomplete:\n${problems.join("\n")}`,
    );
  }

  return config;
}
