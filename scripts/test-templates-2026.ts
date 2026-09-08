/**
 * Tests for template assignment + copy voice validator (2026 redesign).
 */
import { assignTemplate } from "../src/templates/assign-template";
import { resolveTemplateId } from "../src/templates/resolve-template";
import { templateProfile } from "../src/templates/category-template-profile";
import { validateCopyVoice } from "../src/ai/validate-copy-voice";
import { SCHEMA_WHY_CHOOSE_STUB } from "../src/ai/why-choose-stub";
import { findQualityProblems } from "../src/ai/validate-generated-site-config";
import type { SiteConfig } from "../src/content/types/site";
import type { BusinessInput } from "../src/ai/types";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getPhoneHref } from "../src/templates/shared/contact-data";
import {
  isGalleryVisible,
  isOfferVisible,
} from "../src/templates/shared/section-data";
import { isPricingSectionVisible } from "../src/content/sections";

let failures = 0;

function ok(condition: boolean, label: string): void {
  if (!condition) failures += 1;
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

console.log("== template profiles ==");
ok(templateProfile("frizerji").preferred.includes("floating"), "beauty prefers floating");
ok(templateProfile("elektricarji").preferred.includes("bento"), "elektro prefers bento");
ok(templateProfile("vulkanizerji").allowed.includes("outlined"), "auto allows outlined");

console.log("\n== assignTemplate deterministic ==");
const a = assignTemplate({ slug: "demo-salon-1", categoryId: "frizerji" });
const b = assignTemplate({ slug: "demo-salon-1", categoryId: "frizerji" });
ok(a === b, "same slug → same template");
ok(
  assignTemplate({
    slug: "x",
    categoryId: "frizerji",
    override: "type",
  }) === "type",
  "override wins",
);
ok(
  !assignTemplate({
    slug: "weak-photo-salon",
    categoryId: "frizerji",
    imageSignals: { hasHeroImage: false, hasServiceImages: false },
  }).includes?.("x" as never) &&
    assignTemplate({
      slug: "weak-photo-salon",
      categoryId: "frizerji",
      imageSignals: { hasHeroImage: false, hasServiceImages: false },
    }) !== "floating",
  "weak imagery demotes floating",
);

console.log("\n== resolveTemplateId legacy ==");
ok(
  resolveTemplateId({ appearance: "beauty" } as SiteConfig) === "floating",
  "beauty → floating",
);
ok(
  resolveTemplateId({ appearance: "elektro" } as SiteConfig) === "bento",
  "elektro → bento",
);
ok(
  resolveTemplateId({
    appearance: "beauty",
    templateId: "outlined",
  } as SiteConfig) === "outlined",
  "explicit templateId wins",
);

console.log("\n== copy voice ==");
const clientsDir = resolve(__dirname, "../src/content/clients");
const sample = JSON.parse(
  readFileSync(resolve(clientsDir, "artep-manikira-petra/site.json"), "utf8"),
) as SiteConfig;
const business = JSON.parse(
  readFileSync(
    resolve(clientsDir, "artep-manikira-petra/business.json"),
    "utf8",
  ),
) as BusinessInput;

const clean = validateCopyVoice(
  {
    ...sample,
    whyChooseUs: SCHEMA_WHY_CHOOSE_STUB,
    hero: {
      ...sample.hero,
      badge: "Manikira",
      description: "Nega nohtov v Ljubljani.",
    },
  },
  business,
);
ok(clean.ok, "natural short copy passes");

const boilerplate = validateCopyVoice(
  {
    ...sample,
    hero: {
      ...sample.hero,
      description: "Dobrodošli pri nas, kjer smo več kot salon.",
    },
  },
  business,
);
ok(!boilerplate.ok, "boilerplate combination fails");
ok(
  boilerplate.errors.some((e) => e.code === "welcome_agency" || e.code === "more_than_agency"),
  "boilerplate codes present",
);

const placeholder = validateCopyVoice(
  {
    ...sample,
    hero: { ...sample.hero, description: "TODO placeholder copy" },
  },
  business,
);
ok(!placeholder.ok, "placeholder leakage fails");

console.log("\n== quality bounds template2026 ==");
const shortPricing = {
  ...sample,
  pricing: {
    ...sample.pricing!,
    items: sample.pricing!.items.slice(0, 3),
  },
  nav: {
    ...sample.nav,
    links: sample.nav.links.filter((l) => l.href !== "#zakaj-mi").slice(0, 2),
  },
};
ok(
  findQualityProblems(shortPricing, { mode: "template2026" }).every(
    (p) => !p.includes("pricing.items"),
  ),
  "3–6 pricing items allowed in template2026 mode",
);

console.log("\n== phone + pricing visibility helpers ==");
ok(Boolean(getPhoneHref(sample)?.startsWith("tel:")), "sample has tel: href");
ok(
  isOfferVisible(sample) === isPricingSectionVisible(sample) ||
    isOfferVisible(sample),
  "offer visibility wired",
);
ok(typeof isGalleryVisible(sample) === "boolean", "gallery visibility helper");

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nAll template/copy tests passed.");
