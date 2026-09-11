import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Architecture guards for the public demo render path.
 * Asserts import-graph constraints — not millisecond budgets.
 */

const root = resolve(__dirname, "..");
let failures = 0;

function check(label: string, condition: boolean): void {
  if (!condition) {
    failures += 1;
  }
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

function readSrc(relPath: string): string {
  return readFileSync(resolve(root, relPath), "utf8");
}

const sitePage = readSrc("src/app/site-page.tsx");
const slugPage = readSrc("src/app/[slug]/page.tsx");
const loadTemplate = readSrc("src/templates/load-template-page.ts");
const publicConfig = readSrc("src/onboarding/public-site-config.ts");
const publicCache = readSrc("src/onboarding/public-onboarding-cache.ts");
const revalidate = readSrc("src/admin/revalidate.ts");
const registry = readSrc("src/templates/registry.ts");

console.log("== public demo render path ==");

check(
  "site-page does not import @/templates barrel",
  !/from\s+["']@\/templates["']/.test(sitePage),
);

check(
  "site-page does not import templateRegistry",
  !/\btemplateRegistry\b/.test(sitePage),
);

check(
  "site-page does not import assignTemplate",
  !/\bassignTemplate\b/.test(sitePage),
);

check(
  "site-page does not import assignPalette",
  !/\bassignPalette\b/.test(sitePage),
);

check(
  "site-page does not import fat @/theme/palettes index",
  !/from\s+["']@\/theme\/palettes["']/.test(sitePage) &&
    !/from\s+["']@\/theme\/palettes\/index["']/.test(sitePage),
);

check(
  "site-page does not import catalog/palettes",
  !/from\s+["']@\/catalog\/palettes["']/.test(sitePage),
);

check(
  "site-page resolves curated palettes from curated.ts",
  /from\s+["']@\/theme\/palettes\/curated["']/.test(sitePage),
);

check(
  "site-page does not eagerly import appearanceRegistry",
  !/import\s*\{[^}]*appearanceRegistry[^}]*\}\s*from/.test(sitePage),
);

check(
  "site-page lazy-loads zbrendiraj appearance path",
  /import\(["']@\/appearances\/registry["']\)/.test(sitePage),
);

check(
  "site-page uses loadTemplatePage",
  /loadTemplatePage/.test(sitePage),
);

check(
  "slug page does not declare searchParams",
  !/\bsearchParams\b/.test(slugPage),
);

check(
  "slug page keeps revalidate = 300",
  /export\s+const\s+revalidate\s*=\s*300/.test(slugPage),
);

check(
  "public overlay uses React.cache + public onboarding cache",
  /from\s+["']react["']/.test(publicConfig) &&
    /\bcache\b/.test(publicConfig) &&
    /getPublicOnboardingBySlug/.test(publicConfig),
);

check(
  "public onboarding uses unstable_cache with ~300s TTL",
  /unstable_cache/.test(publicCache) && /revalidate:\s*300/.test(publicCache),
);

check(
  "revalidateCustomerPage busts public onboarding tag",
  /publicOnboardingTag/.test(revalidate) && /revalidateTag/.test(revalidate),
);

check(
  "load-template-page uses per-id dynamic import (no static registry import)",
  /await import\(/.test(loadTemplate) &&
    !/from\s+["']\.\/registry["']/.test(loadTemplate) &&
    !/from\s+["']@\/templates\/registry["']/.test(loadTemplate),
);

check(
  "template registry still exists for non-render tooling",
  /BentoPage/.test(registry) && /OutlinedPage/.test(registry),
);

check(
  "site-page does not statically import all four template pages",
  !/from\s+["']@\/templates\/bento\/BentoPage["']/.test(sitePage) &&
    !/from\s+["']@\/templates\/outlined\/OutlinedPage["']/.test(sitePage) &&
    !/from\s+["']@\/templates\/type-minimal\/TypePage["']/.test(sitePage) &&
    !/from\s+["']@\/templates\/floating\/FloatingPage["']/.test(sitePage),
);

console.log("\n== section composition ==");

const sectionData = readSrc("src/templates/shared/section-data.ts");
const topBar = readSrc("src/templates/shared/TemplateTopBar.tsx");
const flagsType = readSrc("src/content/types/site.ts");
const profile = readSrc("src/templates/category-section-profile.ts");

check(
  "SiteSectionFlags includes benefits/process/finalCta",
  /benefits\?: boolean/.test(flagsType) &&
    /process\?: boolean/.test(flagsType) &&
    /finalCta\?: boolean/.test(flagsType),
);

check(
  "serviceArea section type exists",
  /ServiceAreaSectionConfig/.test(flagsType),
);

check(
  "category section profile module exists",
  /SectionProfile/.test(profile) && /sectionProfile\(/.test(profile),
);

check(
  "section-data gates process on flag + ≥3 steps",
  /isProcessSectionFlagEnabled/.test(sectionData) &&
    /steps\.length >= 3/.test(sectionData),
);

check(
  "section-data gates benefits on flag + ≥3 items",
  /isBenefitsSectionFlagEnabled/.test(sectionData) &&
    /items\.length >= 3/.test(sectionData),
);

check(
  "About drops points when Benefits visible",
  /isBenefitsVisible\(config\) \? \[\]/.test(sectionData),
);

check(
  "TopBar uses getOfferSectionMeta id (not hardcoded #cenik only)",
  /getOfferSectionMeta/.test(topBar) &&
    /href: `#\$\{offerMeta\.id\}`/.test(topBar),
);

for (const page of [
  "src/templates/bento/BentoPage.tsx",
  "src/templates/outlined/OutlinedPage.tsx",
  "src/templates/type-minimal/TypePage.tsx",
  "src/templates/floating/FloatingPage.tsx",
]) {
  const src = readSrc(page);
  check(
    `${page} includes optional expanded sections`,
    /TemplateBenefitsSection/.test(src) &&
      /TemplateProcessSection/.test(src) &&
      /TemplateServiceAreaSection/.test(src) &&
      /TemplateFinalCtaSection/.test(src),
  );
}

if (failures > 0) {
  console.error(`\n${failures} guard(s) failed`);
  process.exit(1);
}

console.log("\nAll demo render guards passed");
