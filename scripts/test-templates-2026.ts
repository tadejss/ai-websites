/**
 * Tests for template assignment + copy voice validator (2026 redesign).
 */
import { assignTemplate } from "../src/templates/assign-template";
import {
  assignPalette,
  isPaletteCompatibleWithTemplate,
} from "../src/templates/assign-palette";
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
import { isCuratedPaletteId } from "../src/theme/palettes/curated";
import { isTemplateId } from "../src/templates/types";
import type { TemplateId } from "../src/templates/types";

let failures = 0;

function ok(condition: boolean, label: string): void {
  if (!condition) failures += 1;
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

console.log("== template profiles ==");
ok(templateProfile("frizerji").preferred.includes("floating"), "beauty prefers floating");
ok(templateProfile("elektricarji").preferred.includes("bento"), "elektro prefers bento");
ok(templateProfile("elektricarji").preferred.includes("outlined"), "elektro also prefers outlined");
ok(templateProfile("elektricarji").preferred.length > 1, "TRADE preferred length > 1");
ok(templateProfile("cistilni-servisi").preferred.includes("type"), "cleaning prefers type");
ok(templateProfile("cistilni-servisi").preferred.length > 1, "CLEANING preferred length > 1");
ok(templateProfile("vulkanizerji").allowed.includes("outlined"), "auto allows outlined");
ok(
  templateProfile("elektricarji").preferred.every((id) =>
    templateProfile("elektricarji").allowed.includes(id),
  ),
  "TRADE preferred ⊆ allowed",
);
ok(
  templateProfile("cistilni-servisi").preferred.every((id) =>
    templateProfile("cistilni-servisi").allowed.includes(id),
  ),
  "CLEANING preferred ⊆ allowed",
);

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

const tradeSlugs = [
  "trade-alpha",
  "trade-bravo",
  "trade-charlie",
  "trade-delta",
  "trade-echo",
  "trade-foxtrot",
  "trade-golf",
  "trade-hotel",
];
const tradeTemplates = new Set(
  tradeSlugs.map((slug) =>
    assignTemplate({ slug, categoryId: "elektricarji" }),
  ),
);
ok(tradeTemplates.has("bento"), "TRADE sample includes bento");
ok(tradeTemplates.has("outlined"), "TRADE sample includes outlined");

const cleaningSlugs = [
  "clean-alpha",
  "clean-bravo",
  "clean-charlie",
  "clean-delta",
  "clean-echo",
  "clean-foxtrot",
  "clean-golf",
  "clean-hotel",
];
const cleaningTemplates = new Set(
  cleaningSlugs.map((slug) =>
    assignTemplate({ slug, categoryId: "cistilni-servisi" }),
  ),
);
ok(cleaningTemplates.has("bento"), "CLEANING sample includes bento");
ok(cleaningTemplates.has("type"), "CLEANING sample includes type");

console.log("\n== assignPalette + compatibility ==");
const p1 = assignPalette({
  slug: "demo-salon-1",
  categoryId: "frizerji",
  templateId: "floating",
});
const p2 = assignPalette({
  slug: "demo-salon-1",
  categoryId: "frizerji",
  templateId: "floating",
});
ok(p1 === p2, "same slug+category+template → same palette");
ok(isCuratedPaletteId(p1), "assigned palette is curated");
ok(
  isPaletteCompatibleWithTemplate(p1, {
    templateId: "floating",
    categoryId: "frizerji",
  }),
  "assigned palette compatible with floating/frizerji",
);
ok(
  assignPalette({
    slug: "type-demo",
    categoryId: "cistilni-servisi",
    templateId: "type",
  }) === "charcoal-signal",
  "type template → charcoal-signal",
);
ok(
  isPaletteCompatibleWithTemplate("charcoal-signal", { templateId: "type" }),
  "charcoal-signal compatible with type",
);
ok(
  !isPaletteCompatibleWithTemplate("ink-coral", { templateId: "type" }),
  "ink-coral incompatible with type",
);
ok(
  !isPaletteCompatibleWithTemplate("look-frizerji-01-mist", {
    templateId: "floating",
    categoryId: "frizerji",
  }),
  "legacy look-* palette not curated → incompatible",
);
ok(
  !isPaletteCompatibleWithTemplate("burgundy-cream", {
    templateId: "bento",
    categoryId: "elektricarji",
  }),
  "beauty palette avoided for elektro trade",
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
ok(!isTemplateId("not-a-template"), "invalid templateId rejected");
ok(isTemplateId("bento" as TemplateId), "valid templateId accepted");
ok(isTemplateId("mono" as TemplateId), "mono templateId accepted");

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
