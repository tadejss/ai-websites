/**
 * Smoke: legacy vs expanded section visibility (no invented content).
 */
import type { SiteConfig } from "../src/content/types/site";
import {
  getAboutContent,
  isBenefitsVisible,
  isFinalCtaVisible,
  isProcessVisible,
  isServiceAreaVisible,
} from "../src/templates/shared/section-data";
import { sectionProfile } from "../src/templates/category-section-profile";

let failures = 0;

function check(label: string, condition: boolean): void {
  if (!condition) {
    failures += 1;
  }
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

const base = {
  brand: { prefix: "Test", highlight: "Co" },
  metadata: { title: "t", description: "d" },
  nav: { links: [{ href: "#kontakt", label: "Kontakt" }], cta: "Pokličite" },
  hero: {
    badge: "b",
    title: "Naslov",
    titleHighlight: "poudarek",
    description: "Opis hero.",
    primaryCta: "Pokličite",
    secondaryCta: "Storitve",
    stats: [],
  },
  services: {
    id: "storitve",
    eyebrow: "Storitve",
    title: "Storitve",
    description: "d",
    items: [
      { title: "A", description: "a", icon: "service-1" as const },
      { title: "B", description: "b", icon: "service-2" as const },
      { title: "C", description: "c", icon: "service-3" as const },
    ],
  },
  whyChooseUs: {
    id: "zakaj-mi",
    eyebrow: "O nas",
    title: "O podjetju",
    description: "Konkreten opis podjetja.",
    highlights: ["Točka ena", "Točka dva", "Točka tri"],
    benefits: [
      { title: "Ena", label: "Ena", description: "Razlog ena" },
      { title: "Dva", label: "Dva", description: "Razlog dva" },
      { title: "Tri", label: "Tri", description: "Razlog tri" },
    ],
  },
  contact: {
    id: "kontakt",
    eyebrow: "Kontakt",
    title: "Kontakt",
    description: "Pokličite.",
    items: [
      {
        label: "Telefon",
        value: "040 000 000",
        href: "tel:+38640000000",
        icon: "phone" as const,
      },
    ],
    form: {
      title: "t",
      description: "d",
      nameLabel: "Ime",
      namePlaceholder: "Ime",
      phoneLabel: "Telefon",
      phonePlaceholder: "Telefon",
      messageLabel: "Sporočilo",
      messagePlaceholder: "Sporočilo",
      submitLabel: "Pošlji",
    },
  },
  footer: { address: "Ljubljana", rights: "©" },
  business: {
    name: "Test Co",
    address: "Ljubljana",
    email: "a@b.si",
  },
  privacy: {
    enabled: true,
    analytics: false,
    marketing: false,
    thirdParty: {
      googleMaps: false,
      youtube: false,
    },
    cookies: { nonEssential: false },
  },
} as SiteConfig;

console.log("== legacy (no expanded flags) ==");
check("benefits hidden", !isBenefitsVisible(base));
check("process hidden", !isProcessVisible(base));
check("finalCta hidden", !isFinalCtaVisible(base));
check("serviceArea hidden", !isServiceAreaVisible(base));
check(
  "About keeps highlight points",
  getAboutContent(base).points.length === 3,
);

console.log("\n== expanded benefits ==");
const withBenefits = {
  ...base,
  sections: { benefits: true },
} as SiteConfig;
check("benefits visible with ≥3 items", isBenefitsVisible(withBenefits));
check(
  "About drops points when benefits on",
  getAboutContent(withBenefits).points.length === 0,
);

console.log("\n== process gate ==");
const withEmptyProcess = {
  ...base,
  sections: { process: true },
} as SiteConfig;
check(
  "process hidden when flag but no steps",
  !isProcessVisible(withEmptyProcess),
);

const withProcess = {
  ...base,
  sections: { process: true },
  whyChooseUs: {
    ...base.whyChooseUs,
    steps: {
      id: "postopek",
      eyebrow: "Postopek",
      title: "Kako poteka",
      items: [
        { title: "Klic", description: "Dogovorimo termin." },
        { title: "Ogled", description: "Pregled na lokaciji." },
        { title: "Izvedba", description: "Opravimo dogovorjeno." },
      ],
    },
  },
} as SiteConfig;
check("process visible with 3 steps + flag", isProcessVisible(withProcess));

console.log("\n== serviceArea ==");
const withArea = {
  ...base,
  serviceArea: {
    id: "obmocje",
    eyebrow: "Območje",
    title: "Območje dela",
    description: "Ljubljana z okolico",
  },
} as SiteConfig;
check("serviceArea visible with payload", isServiceAreaVisible(withArea));

console.log("\n== category profiles ==");
const trade = sectionProfile("vodovodarji-ogrevanje");
const beauty = sectionProfile("frizerji");
const cleaning = sectionProfile("cistilni-servisi");
const fallback = sectionProfile(null);
check("trade wants process+benefits", trade.process && trade.benefits);
check("beauty wants process+benefits", beauty.process && beauty.benefits);
check("cleaning wants serviceArea", cleaning.serviceArea);
check("fallback serviceArea off by default", !fallback.serviceArea);

if (failures > 0) {
  console.error(`\n${failures} smoke check(s) failed`);
  process.exit(1);
}
console.log("\nSection composition smoke passed");
