import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isRetryable } from "../src/ai/generation-error";
import {
  buildUserPrompt,
  parseAndValidateSiteConfig,
} from "../src/ai/providers/prompt";
import type { BusinessInput } from "../src/ai/types";
import { findUnsupportedClaims } from "../src/ai/validate-claims";
import { validateBusinessInput } from "../src/ai/validate-business-input";
import { findQualityProblems } from "../src/ai/validate-generated-site-config";
import type { SiteConfig } from "../src/content/types/site";
import { validateSiteConfig } from "../src/content/validate-site-config";

const clientsDir = resolve(__dirname, "../src/content/clients");

const GENERATED_CLIENTS = [
  "avtoservis-novak",
  "hc-hair-culture",
  "modri-zob-zobozdravstveni",
  "linhartova-dvorana-javni",
  "kavarna-trnovo",
];

let failures = 0;

function check(label: string, condition: boolean): void {
  if (!condition) {
    failures += 1;
  }
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

function readJson(client: string, file: string): unknown {
  return JSON.parse(readFileSync(resolve(clientsDir, client, file), "utf8"));
}

function loadSite(client: string): SiteConfig {
  return readJson(client, "site.json") as SiteConfig;
}

function loadBusiness(client: string): BusinessInput {
  return readJson(client, "business.json") as BusinessInput;
}

console.log("== claim detection ==");

const kavarnaSite = loadSite("kavarna-trnovo");
const kavarnaBusiness = loadBusiness("kavarna-trnovo");

function siteWithBadge(badge: string): SiteConfig {
  return {
    ...kavarnaSite,
    hero: { ...kavarnaSite.hero, badge, stats: [] },
    whyChooseUs: { ...kavarnaSite.whyChooseUs, benefits: [], highlights: [] },
  };
}

const claimCases: Array<[string, string, BusinessInput, boolean]> = [
  [
    "experience claim without yearsExperience",
    "20 let izkušenj",
    { ...kavarnaBusiness, yearsExperience: "" },
    true,
  ],
  [
    "experience claim when yearsExperience is known",
    "20 let izkušenj",
    { ...kavarnaBusiness, yearsExperience: "20 let" },
    false,
  ],
  ["invented customer count", "500+ zadovoljnih strank", kavarnaBusiness, true],
  ["invented award", "Nagrajena kavarna", kavarnaBusiness, true],
  [
    "guarantee supported by the source",
    "Garancija na vse storitve",
    { ...kavarnaBusiness, sellingPoints: ["Garancija na delo"] },
    false,
  ],
  ["always-open claim with normal hours", "Odprto 24/7", kavarnaBusiness, true],
  [
    "always-open claim when hours agree",
    "Odprto 24 ur",
    { ...kavarnaBusiness, openingHours: "Monday: Open 24 hours" },
    false,
  ],
  ["day count derivable from hours", "7 dni v tednu", kavarnaBusiness, false],
  [
    "qualitative copy",
    "Osebni pristop in strokovna obravnava",
    kavarnaBusiness,
    false,
  ],
  [
    "address digits are not a claim",
    "Devinska ulica 1c, 1000 Ljubljana",
    kavarnaBusiness,
    false,
  ],
];

for (const [label, badge, business, shouldFlag] of claimCases) {
  const flagged = findUnsupportedClaims(siteWithBadge(badge), business).some(
    (claim) => claim.field === "hero.badge",
  );
  check(`${label} -> flagged=${flagged}`, flagged === shouldFlag);
}

console.log("\n== existing content still validates ==");

for (const client of GENERATED_CLIENTS) {
  const site = loadSite(client);
  check(`${client} passes the render schema`, Boolean(validateSiteConfig(site)));
  check(
    `${client} passes the generation quality gate`,
    findQualityProblems(site).length === 0,
  );
  check(
    `${client} business input validates`,
    Boolean(validateBusinessInput(loadBusiness(client))),
  );
}

const defaultSite = readJson("default", "site.json");
check(
  "default fallback still passes the render schema",
  Boolean(validateSiteConfig(defaultSite)),
);

console.log("\n== thin output is rejected ==");

const thin = JSON.parse(JSON.stringify(kavarnaSite)) as SiteConfig;
thin.hero.stats = [];
thin.services.items = [];
thin.hero.title = "   ";

const thinProblems = findQualityProblems(thin);
check("empty hero stats flagged", thinProblems.some((p) => p.includes("hero.stats")));
check(
  "empty services flagged",
  thinProblems.some((p) => p.includes("services.items")),
);
check("blank title flagged", thinProblems.some((p) => p.includes("hero.title")));

console.log("\n== gallery partial section defaults ==");

const partialGallerySite = JSON.parse(
  readFileSync(resolve(clientsDir, "avtokleparstvo-avtolicarstvo-branko/site.json"), "utf8"),
) as SiteConfig;
const partialGalleryBusiness = loadBusiness("avtokleparstvo-avtolicarstvo-branko");
const partialGalleryPayload = { ...partialGallerySite } as Record<string, unknown>;
partialGalleryPayload.gallery = { id: "galerija", items: [] };
delete partialGalleryPayload.appearance;
delete partialGalleryPayload.theme;
delete partialGalleryPayload.layout;
delete partialGalleryPayload.images;
delete partialGalleryPayload.sections;

let partialGalleryAccepted = false;
try {
  const normalized = parseAndValidateSiteConfig(
    JSON.stringify(partialGalleryPayload),
    "TestProvider",
    partialGalleryBusiness,
  );
  partialGalleryAccepted =
    normalized.gallery?.eyebrow === "Galerija"
    && normalized.gallery?.title === "Vpogled v naše delo";
} catch {
  partialGalleryAccepted = false;
}

check(
  "partial gallery gets eyebrow/title defaults before validation",
  partialGalleryAccepted,
);

console.log("\n== retry classification ==");

function attempt(content: string): { retryable: boolean; message: string } {
  try {
    parseAndValidateSiteConfig(content, "TestProvider", kavarnaBusiness);
    return { retryable: false, message: "" };
  } catch (error) {
    return {
      retryable: isRetryable(error),
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

check("invalid JSON is retryable", attempt("not json").retryable);
check(
  "schema violation is retryable",
  attempt(JSON.stringify({ brand: { prefix: "A" } })).retryable,
);

const fabricated = JSON.parse(JSON.stringify(kavarnaSite)) as SiteConfig;
fabricated.hero.stats[0] = { value: "100%", label: "Zadovoljne stranke" };
const claimAttempt = attempt(JSON.stringify(fabricated));

check("unsupported claim is retryable", claimAttempt.retryable);
check(
  "correction names the offending field",
  claimAttempt.message.includes("hero.stats[0].value"),
);

const cleaned = JSON.parse(JSON.stringify(kavarnaSite)) as SiteConfig;
cleaned.hero.stats[1] = { value: "Domača", label: "Peka" };
cleaned.whyChooseUs.benefits[0].stat = "Osebni";
check(
  "clean output is accepted",
  attempt(JSON.stringify(cleaned)).retryable === false,
);

check(
  "missing API key is not retryable",
  !isRetryable(new Error("GEMINI_API_KEY is not configured")),
);
check("quota error is not retryable", !isRetryable(new Error("429 rate limit")));
check(
  "correction reaches the retry prompt",
  buildUserPrompt(kavarnaBusiness, "fix hero.stats").includes(
    "previous attempt was rejected",
  ),
);
check(
  "first attempt carries no correction",
  !buildUserPrompt(kavarnaBusiness).includes("previous attempt"),
);

console.log(failures === 0 ? "\nAll guard checks passed." : `\n${failures} check(s) failed.`);

if (failures > 0) {
  process.exit(1);
}
