/**
 * Phase-11 QA for 2026 templates:
 * - composition fingerprints (distinct geometry signals)
 * - AI smell test via validateCopyVoice on preview + sample clients
 * - perf hard limits (static)
 * - optional live HTML check against TEMPLATE_QA_BASE_URL
 *
 * Screenshot matrix (manual): same lead × 4 templates × 360/390/430/768/1440
 *   /preview-bento | /preview-outlined | /preview-type | /preview-floating
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { validateCopyVoice } from "../src/ai/validate-copy-voice";
import type { BusinessInput } from "../src/ai/types";
import type { SiteConfig } from "../src/content/types/site";
import { TEMPLATE_IDS } from "../src/templates/types";
import { getTemplateImagePlan } from "../src/templates/image-plan";
import { resolveTemplateTokens } from "../src/templates/tokens";
import { templateRegistry } from "../src/templates/registry";

let failures = 0;

function ok(condition: boolean, label: string): void {
  if (!condition) {
    failures += 1;
  }
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

function readClient(slug: string): {
  site: SiteConfig;
  business: BusinessInput | null;
} {
  const dir = resolve(__dirname, "../src/content/clients", slug);
  const site = JSON.parse(
    readFileSync(resolve(dir, "site.json"), "utf8"),
  ) as SiteConfig;
  let business: BusinessInput | null = null;
  try {
    business = JSON.parse(
      readFileSync(resolve(dir, "business.json"), "utf8"),
    ) as BusinessInput;
  } catch {
    business = null;
  }
  return { site, business };
}

async function main(): Promise<void> {
  console.log("== composition fingerprints (distinct geometry) ==");

  const pageSources: Record<string, string> = {};
  for (const id of TEMPLATE_IDS) {
    const relative =
      id === "type"
        ? "type-minimal/TypePage.tsx"
        : id === "bento"
          ? "bento/BentoPage.tsx"
          : id === "outlined"
            ? "outlined/OutlinedPage.tsx"
            : "floating/FloatingPage.tsx";
    pageSources[id] = readFileSync(
      resolve(__dirname, "../src/templates", relative),
      "utf8",
    );
  }

  ok(
    pageSources.bento.includes("lg:grid-cols-6") &&
      !pageSources.bento.includes("StickyPhoneBar"),
    "bento: bento hero grid, no sticky phone",
  );
  ok(
    pageSources.outlined.includes("border-2") &&
      pageSources.outlined.includes("shadow-[4px_4px_0"),
    "outlined: hard borders + offset shadow pricing",
  );
  ok(
    pageSources.type.includes("clamp(") &&
      !pageSources.type.includes("StickyPhoneBar"),
    "type: clamp headline, no sticky phone",
  );
  ok(
    pageSources.floating.includes("rounded-full") ||
      pageSources.floating.includes("!rounded-full"),
    "floating: soft rounded CTAs",
  );

  const heroSignals = TEMPLATE_IDS.map((id) => {
    const src = pageSources[id];
    return [
      id,
      src.includes("lg:grid-cols-6")
        ? "bento"
        : src.includes("lg:grid-cols-2") || src.includes("lg:grid-cols-12")
          ? "split"
          : "stack",
      src.includes("border-2") ? "outline" : "soft",
      src.includes("clamp(") ? "clamp" : "fixedtype",
    ].join("|");
  });
  ok(
    new Set(heroSignals).size === 4,
    "four distinct hero/CTA geometry signatures",
  );

  console.log("\n== image roles ==");
  ok(
    getTemplateImagePlan("bento").preferPortraitHero === false,
    "bento landscape-ok hero",
  );
  ok(
    getTemplateImagePlan("floating").preferPortraitHero === true,
    "floating portrait hero",
  );
  ok(
    getTemplateImagePlan("type").serviceRole === "service-none",
    "type service-none",
  );

  console.log("\n== perf hard limits (static) ==");
  for (const id of TEMPLATE_IDS) {
    const tokens = resolveTemplateTokens(id);
    const uniqueFonts = new Set(
      [tokens.fontBody, tokens.fontDisplay].map((f) =>
        f.replace(/,.*/, "").trim(),
      ),
    );
    ok(uniqueFonts.size <= 2, `${id}: ≤2 font families (${uniqueFonts.size})`);
    ok(!pageSources[id].includes("<video"), `${id}: no video element`);
    ok(Boolean(templateRegistry[id]?.Page), `${id}: page registered`);
  }

  // Gallery carousel is an accepted user exception to the original "no carousel" rule.
  ok(
    pageSources.bento.includes("TemplateGalleryCarousel"),
    "gallery uses carousel (accepted exception)",
  );

  console.log("\n== AI smell test (copy voice) ==");
  const smellSlugs = [
    "preview-bento",
    "preview-outlined",
    "preview-type",
    "preview-floating",
    "artep-manikira-petra",
    "elektro-keber-ziga",
  ];

  for (const slug of smellSlugs) {
    try {
      const { site, business } = readClient(slug);
      if (!business) {
        ok(false, `${slug}: missing business.json`);
        continue;
      }
      const voice = validateCopyVoice(site, business);
      ok(
        voice.ok,
        `${slug}: copy voice ok (errors=${voice.errors.length}, warnings=${voice.warnings.length})`,
      );
      for (const error of voice.errors.slice(0, 3)) {
        console.log(`       ERROR  ${error.code}: ${error.message}`);
      }
      for (const warning of voice.warnings.slice(0, 2)) {
        console.log(`       WARN   ${warning.code}: ${warning.message}`);
      }
    } catch (error) {
      ok(false, `${slug}: ${error instanceof Error ? error.message : error}`);
    }
  }

  const clientsDir = resolve(__dirname, "../src/content/clients");
  for (const id of TEMPLATE_IDS) {
    ok(
      readdirSync(clientsDir).includes(`preview-${id}`),
      `preview-${id} client present`,
    );
  }

  console.log("\n== optional live HTML fingerprints ==");
  const baseUrl = process.env.TEMPLATE_QA_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    console.log(
      "SKIP  set TEMPLATE_QA_BASE_URL=http://localhost:3020 for live HTML checks",
    );
  } else {
    for (const id of TEMPLATE_IDS) {
      const slug = `preview-${id}`;
      try {
        const response = await fetch(`${baseUrl}/${slug}`);
        const html = await response.text();
        ok(html.includes(`data-template="${id}"`), `live ${slug} data-template`);
      } catch (error) {
        ok(
          false,
          `live ${slug}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
  }

  console.log("\n== manual screenshot matrix ==");
  console.log(
    "Open same lead at widths 360 / 390 / 430 / 768 / 1440 for:",
  );
  for (const id of TEMPLATE_IDS) {
    console.log(`  ${(baseUrl ?? "http://localhost:3020")}/preview-${id}`);
  }
  console.log(
    "Compare: hero image position, CTA position, offer structure, whitespace, containers.",
  );

  if (failures) {
    console.error(`\n${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\nTemplate QA passed.");
}

void main();
