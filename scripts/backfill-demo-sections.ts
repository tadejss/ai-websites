/**
 * Fill-missing optional demo sections. Never overwrites non-empty copy.
 *
 * Usage:
 *   npx tsx scripts/backfill-demo-sections.ts           # dry-run (default)
 *   npx tsx scripts/backfill-demo-sections.ts --write
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { BusinessInput } from "../src/ai/types";
import { validateClaims } from "../src/ai/validate-claims";
import type { SiteConfig } from "../src/content/types/site";
import { validateSiteConfig } from "../src/content/validate-site-config";
import { withSectionNavLinks } from "../src/content/apply-new-lead-sections";
import { resolveImagePoolCategory } from "../src/images/image-pool-category";
import { sectionProfile } from "../src/templates/category-section-profile";
import {
  getBenefitsContent,
  getFaqItems,
  getProcessContent,
} from "../src/templates/shared/section-data";
import { isPricingSectionVisible } from "../src/content/sections";

const clientsDir = resolve(__dirname, "../src/content/clients");
const write = process.argv.includes("--write");
const dryRun = !write;

let scanned = 0;
let changed = 0;
let skipped = 0;

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function buildFaqFromFacts(config: SiteConfig): SiteConfig["contact"]["faq"] {
  // Persist the same deterministic FAQ helpers use — only known facts.
  const items = getFaqItems({
    ...config,
    contact: { ...config.contact, faq: undefined },
  });
  return items.length >= 2 ? items : undefined;
}

function maybeServiceArea(
  config: SiteConfig,
  business: BusinessInput,
  want: boolean,
): SiteConfig["serviceArea"] | undefined {
  if (!want) {
    return config.serviceArea;
  }
  if (config.serviceArea?.description?.trim()) {
    return config.serviceArea;
  }
  const area = business.serviceArea?.trim();
  if (!area) {
    return undefined;
  }
  return {
    id: "obmocje",
    eyebrow: "Območje",
    title: "Območje dela",
    description: area,
  };
}

function processSlug(slug: string): void {
  scanned += 1;
  const sitePath = resolve(clientsDir, slug, "site.json");
  const businessPath = resolve(clientsDir, slug, "business.json");
  if (!existsSync(sitePath) || !existsSync(businessPath)) {
    skipped += 1;
    return;
  }

  let site = validateSiteConfig(loadJson(sitePath));
  if (site.appearance === "zbrendiraj") {
    skipped += 1;
    return;
  }

  const business = loadJson<BusinessInput>(businessPath);
  const categoryId = resolveImagePoolCategory({
    industry: business.industry,
    companyName: business.companyName,
    services: business.services,
  });
  const profile = sectionProfile(categoryId);

  const before = JSON.stringify(site);
  const nextSections = { ...site.sections };
  let next: SiteConfig = { ...site, sections: nextSections };

  // FAQ — only when empty
  if (!site.contact.faq?.length) {
    const faq = buildFaqFromFacts(site);
    if (faq?.length) {
      next = {
        ...next,
        contact: { ...next.contact, faq },
      };
    }
  }

  // Service area — only explicit business.serviceArea; never invent from address
  if (profile.serviceArea) {
    const area = maybeServiceArea(next, business, true);
    if (area) {
      next = { ...next, serviceArea: area };
    }
  }

  // Benefits flag — only when ≥3 concrete items already exist
  if (profile.benefits && getBenefitsContent(next).items.length >= 3) {
    nextSections.benefits = true;
  }

  // Process flag — only when steps already present (never invent steps here)
  if (profile.process && getProcessContent(next).steps.length >= 3) {
    nextSections.process = true;
  }

  if (profile.finalCta) {
    nextSections.finalCta = true;
  }

  next = {
    ...next,
    sections: {
      ...next.sections,
      ...nextSections,
      gallery: next.sections?.gallery ?? site.sections?.gallery,
      pricing:
        next.sections?.pricing ??
        site.sections?.pricing ??
        (isPricingSectionVisible(site) ? true : site.sections?.pricing),
    },
  };

  next = withSectionNavLinks(next);
  next = validateSiteConfig(next);

  try {
    validateClaims(next, business);
  } catch (error) {
    console.log(
      `SKIP  ${slug}  claim validation: ${
        error instanceof Error ? error.message.split("\n")[0] : error
      }`,
    );
    skipped += 1;
    return;
  }

  if (JSON.stringify(next) === before) {
    return;
  }

  changed += 1;
  const flags = [
    next.sections?.benefits ? "benefits" : null,
    next.sections?.process ? "process" : null,
    next.sections?.finalCta ? "finalCta" : null,
    next.serviceArea ? "serviceArea" : null,
    next.contact.faq?.length && !site.contact.faq?.length ? "faq" : null,
  ].filter(Boolean);

  console.log(
    `${dryRun ? "DRY" : "WRITE"}  ${slug}  +${flags.join(",") || "nav"}`,
  );

  if (!dryRun) {
    writeFileSync(sitePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  }
}

const slugs = readdirSync(clientsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const slug of slugs) {
  processSlug(slug);
}

console.log(
  `\n${dryRun ? "Dry-run" : "Write"} done. scanned=${scanned} changed=${changed} skipped=${skipped}`,
);
if (dryRun) {
  console.log("Re-run with --write to persist.");
}
