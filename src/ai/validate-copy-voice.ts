import type { SiteConfig } from "@/content/types/site";
import type { BusinessInput } from "./types";
import { findUnsupportedClaims } from "./validate-claims";

export type CopyVoiceIssue = {
  severity: "error" | "warning";
  field?: string;
  message: string;
  code: string;
};

export type CopyVoiceResult = {
  ok: boolean;
  errors: CopyVoiceIssue[];
  warnings: CopyVoiceIssue[];
};

const PLACEHOLDER_PATTERN =
  /\b(lorem ipsum|TODO|TBD|placeholder|\[insert|xxx+)\b/i;

/** Obvious AI boilerplate *combinations* / stacks — not single natural words. */
const BOILERPLATE_PATTERNS: Array<{ code: string; pattern: RegExp }> = [
  {
    code: "welcome_agency",
    pattern: /dobrodo[sš]li\s+pri\b/i,
  },
  {
    code: "more_than_agency",
    pattern: /smo\s+ve[cč]\s+kot\b/i,
  },
  {
    code: "committed_quality",
    pattern: /zavezani\s+(smo\s+)?kakovosti/i,
  },
  {
    code: "satisfaction_priority",
    pattern:
      /va[sš]e\s+zadovoljstvo\s+je\s+na[sš]a\s+prioriteta|zadovoljstvo\s+strank\s+je\s+na[sš]a\s+prioriteta/i,
  },
  {
    code: "one_stop_shop",
    pattern: /na\s+enem\s+mestu\b/i,
  },
  {
    code: "complete_solutions",
    pattern: /celovit(e|ih)?\s+re[sš]it(ve|ev)\b/i,
  },
  {
    code: "triple_adjective_stack",
    pattern:
      /strokovno[,\s]+zanesljivo\s+in\s+kakovostno|kakovostno[,\s]+strokovno\s+in\s+zanesljivo/i,
  },
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceCount(value: string): number {
  return value.split(/[.!?]+/).filter((part) => part.trim().length > 0).length;
}

function adjectiveDensity(value: string): number {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return 0;
  }
  const adjHits = words.filter((word) =>
    /(en|na|no|ni|ne|ega|ih|imi)$/i.test(word) && word.length > 5,
  ).length;
  return adjHits / words.length;
}

function collectTemplateCopy(config: SiteConfig): Array<[string, string]> {
  const entries: Array<[string, string]> = [
    ["hero.badge", config.hero.badge],
    ["hero.title", config.hero.title],
    ["hero.titleHighlight", config.hero.titleHighlight],
    ["hero.description", config.hero.description],
    ["hero.primaryCta", config.hero.primaryCta],
    ["services.title", config.services.title],
    ["services.description", config.services.description],
    ["contact.title", config.contact.title],
    ["contact.description", config.contact.description],
  ];

  config.services.items.forEach((item, index) => {
    entries.push([`services.items[${index}].title`, item.title]);
    entries.push([`services.items[${index}].description`, item.description]);
  });

  config.pricing?.items.forEach((item, index) => {
    entries.push([`pricing.items[${index}].name`, item.name]);
    if (item.description) {
      entries.push([
        `pricing.items[${index}].description`,
        item.description,
      ]);
    }
  });

  return entries;
}

/**
 * Deterministic copy voice checks for new template generation.
 * ERROR = hard fail; WARNING = log / soft correction hint. No score threshold.
 */
export function validateCopyVoice(
  config: SiteConfig,
  input: BusinessInput,
): CopyVoiceResult {
  const errors: CopyVoiceIssue[] = [];
  const warnings: CopyVoiceIssue[] = [];
  const entries = collectTemplateCopy(config);
  const company = normalize(input.companyName || "");

  for (const [field, value] of entries) {
    if (PLACEHOLDER_PATTERN.test(value)) {
      errors.push({
        severity: "error",
        field,
        code: "placeholder_leakage",
        message: `${field} contains placeholder text`,
      });
    }

    for (const rule of BOILERPLATE_PATTERNS) {
      if (rule.pattern.test(value)) {
        errors.push({
          severity: "error",
          field,
          code: rule.code,
          message: `${field} matches AI boilerplate pattern (${rule.code})`,
        });
      }
    }

    if (field.endsWith(".description") || field === "hero.description") {
      if (sentenceCount(value) > 2) {
        warnings.push({
          severity: "warning",
          field,
          code: "too_many_sentences",
          message: `${field} has more than 2 sentences — write less`,
        });
      }
      if (value.length > 220) {
        warnings.push({
          severity: "warning",
          field,
          code: "too_long",
          message: `${field} is long (${value.length} chars)`,
        });
      }
      if (adjectiveDensity(value) > 0.35 && value.split(/\s+/).length > 8) {
        warnings.push({
          severity: "warning",
          field,
          code: "adjective_density",
          message: `${field} is adjective-heavy`,
        });
      }
    }

    if (company && normalize(value).split(company).length - 1 >= 2) {
      warnings.push({
        severity: "warning",
        field,
        code: "name_repetition",
        message: `${field} repeats the business name`,
      });
    }
  }

  const serviceDescriptions = config.services.items.map((item) =>
    normalize(item.description),
  );
  const seen = new Set<string>();
  for (let i = 0; i < serviceDescriptions.length; i++) {
    const desc = serviceDescriptions[i]!;
    if (desc.length < 12) {
      continue;
    }
    if (seen.has(desc)) {
      errors.push({
        severity: "error",
        field: `services.items[${i}].description`,
        code: "duplicate_service_description",
        message: "Duplicate service descriptions",
      });
    }
    seen.add(desc);
  }

  for (const claim of findUnsupportedClaims(config, input)) {
    errors.push({
      severity: "error",
      field: claim.field,
      code: "unsupported_claim",
      message: `${claim.field}: ${claim.reason}`,
    });
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
