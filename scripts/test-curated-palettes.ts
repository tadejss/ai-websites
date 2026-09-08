/**
 * Curated palette system tests (14 palettes + resolution + template bind).
 */
import { validatePaletteContrast } from "../src/catalog/contrast/validate-palette";
import { validateSiteConfig } from "../src/content/validate-site-config";
import type { SiteConfig } from "../src/content/types/site";
import { assignPalette } from "../src/templates/assign-palette";
import {
  mergeTemplatePaletteCssVars,
  resolveTemplateStructure,
} from "../src/templates/tokens";
import type { TemplateId } from "../src/templates/types";
import {
  CURATED_PALETTE_IDS,
  CURATED_PALETTES,
  TEMPLATE_DEFAULT_PALETTE_ID,
  getCuratedPalette,
  getLegacyPaletteDefinition,
  getPalette,
  isCuratedPaletteId,
  mapLegacyPaletteIdToCurated,
} from "../src/theme/palettes";
import { paletteToTokens } from "../src/theme/utils/tokens";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let failures = 0;

function ok(condition: boolean, label: string): void {
  if (!condition) failures += 1;
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

function isHex(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

console.log("== inventory ==");
ok(CURATED_PALETTES.length === 14, "exactly 14 curated palettes");
ok(
  CURATED_PALETTES.filter((p) => p.mode === "light").length === 9,
  "9 light",
);
ok(CURATED_PALETTES.filter((p) => p.mode === "dark").length === 5, "5 dark");
ok(
  new Set(CURATED_PALETTES.map((p) => p.id)).size === 14,
  "unique ids",
);
ok(
  new Set(CURATED_PALETTES.map((p) => p.name)).size === 14,
  "unique names",
);

console.log("\n== hex + semantic roles ==");
for (const palette of CURATED_PALETTES) {
  ok(
    palette.swatches.every(isHex),
    `${palette.id} swatches are hex`,
  );
  const tokens = paletteToTokens(palette);
  ok(Boolean(tokens.background && tokens.foreground && tokens.accent), `${palette.id} semantic roles`);
  ok(Boolean(tokens.muted && tokens.border && tokens.surface), `${palette.id} muted/border/surface`);
}

console.log("\n== contrast ==");
for (const palette of CURATED_PALETTES) {
  const result = validatePaletteContrast(palette);
  ok(result.ok, `${palette.id} contrast${result.ok ? "" : `: ${result.failures.map((f) => f.pair).join(",")}`}`);
}

console.log("\n== resolution ==");
const coral = getPalette("ink-coral");
ok(coral?.id === "ink-coral", "curated id resolves exactly");
ok(isCuratedPaletteId("obsidian-lime"), "isCuratedPaletteId");

const zbrendiraj = getPalette("zbrendiraj");
const zbrendirajLegacy = getLegacyPaletteDefinition("zbrendiraj");
ok(zbrendiraj?.id === "zbrendiraj", "zbrendiraj resolves");
ok(
  zbrendiraj?.tokens?.accent === "#C7FF3D" &&
    zbrendiraj?.swatches?.[2] === "#C7FF3D",
  "zbrendiraj accent hex unchanged",
);
ok(
  zbrendiraj?.tokens?.background === "#000000" &&
    zbrendirajLegacy?.tokens?.background === "#000000",
  "zbrendiraj background unchanged",
);
ok(
  JSON.stringify(zbrendiraj?.tokens) === JSON.stringify(zbrendirajLegacy?.tokens),
  "zbrendiraj tokens match legacy definition",
);

const legacyLook = getPalette("look-nohti-pedikura-02-slate");
ok(
  Boolean(legacyLook && isCuratedPaletteId(legacyLook.id)),
  "legacy look-* remaps to curated",
);
ok(
  mapLegacyPaletteIdToCurated("look-a").id ===
    mapLegacyPaletteIdToCurated("look-a").id,
  "legacy map deterministic",
);
ok(
  CURATED_PALETTE_IDS.includes(mapLegacyPaletteIdToCurated("warm-earth").id),
  "named legacy → curated membership only",
);

const a = getPalette("look-foo-bar");
const b = getPalette("look-foo-bar");
ok(a?.id === b?.id, "same legacy id → same curated");

console.log("\n== zod soft paletteId ==");
{
  const samplePath = resolve(
    __dirname,
    "../src/content/clients/preview-bento/site.json",
  );
  const sample = JSON.parse(readFileSync(samplePath, "utf8")) as SiteConfig;
  try {
    const parsed = validateSiteConfig({
      ...sample,
      theme: { paletteId: "look-legacy-whatever-not-in-enum" },
    });
    ok(
      parsed.theme?.paletteId === "look-legacy-whatever-not-in-enum",
      "legacy paletteId loads via Zod",
    );
  } catch (error) {
    ok(false, `legacy paletteId loads via Zod: ${String(error)}`);
  }
}

console.log("\n== assignPalette ==");
const beautyA = assignPalette({
  slug: "salon-alpha",
  categoryId: "frizerji",
  templateId: "floating",
});
const beautyB = assignPalette({
  slug: "salon-alpha",
  categoryId: "frizerji",
  templateId: "floating",
});
ok(beautyA === beautyB, "assignPalette deterministic");
ok(isCuratedPaletteId(beautyA), "assignPalette returns curated id");

const beautyPalette = getCuratedPalette(beautyA)!;
ok(
  !beautyPalette.avoidFor?.includes("beauty"),
  "beauty assignment not avoidFor beauty",
);

ok(
  assignPalette({
    slug: "x",
    categoryId: "frizerji",
    templateId: "floating",
    override: "deep-plum",
  }) === "deep-plum",
  "override wins",
);

ok(
  assignPalette({
    slug: "type-shop",
    categoryId: "cistilni-servisi",
    templateId: "type",
  }) === "charcoal-signal",
  "type template biases charcoal-signal",
);

console.log("\n== template defaults ==");
ok(TEMPLATE_DEFAULT_PALETTE_ID.bento === "obsidian-lime", "bento default");
ok(TEMPLATE_DEFAULT_PALETTE_ID.outlined === "ink-coral", "outlined default");
ok(TEMPLATE_DEFAULT_PALETTE_ID.type === "charcoal-signal", "type default");
ok(TEMPLATE_DEFAULT_PALETTE_ID.floating === "burgundy-cream", "floating default");

console.log("\n== template bind (structure + color) ==");
const templates: TemplateId[] = ["bento", "outlined", "type", "floating"];
const probePalettes = ["ink-coral", "obsidian-lime"] as const;

for (const templateId of templates) {
  const structure = resolveTemplateStructure(templateId);
  const aVars = mergeTemplatePaletteCssVars(
    structure,
    getPalette(probePalettes[0])!,
  );
  const bVars = mergeTemplatePaletteCssVars(
    structure,
    getPalette(probePalettes[1])!,
  );

  ok(
    aVars["--background" as keyof typeof aVars] !==
      bVars["--background" as keyof typeof bVars],
    `${templateId}: --background changes with palette`,
  );
  ok(
    aVars["--accent" as keyof typeof aVars] !==
      bVars["--accent" as keyof typeof bVars],
    `${templateId}: --accent changes with palette`,
  );
  ok(
    aVars["--radius" as keyof typeof aVars] === structure.radius &&
      bVars["--radius" as keyof typeof bVars] === structure.radius,
    `${templateId}: radius stays from template structure`,
  );
  ok(
    aVars["--font-body" as keyof typeof aVars] === structure.fontBody &&
      bVars["--font-body" as keyof typeof bVars] === structure.fontBody,
    `${templateId}: fonts stay from template structure`,
  );
}

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}

console.log("\nAll curated palette tests passed.");
