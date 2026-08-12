import { assignTheme } from "../src/theme/assign-theme";
import { resolveThemeCssVars } from "../src/theme/resolve-theme";
import { THEME_CSS_VAR_NAMES } from "../src/theme/types";
import { paletteToTokens } from "../src/theme/utils/tokens";
import { getPalette } from "../src/theme/palettes";
import { contrastForeground } from "../src/theme/utils/color";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

console.log("== assignTheme deterministic ==");
const first = assignTheme("test-salon-a", "beauty", new Set());
const second = assignTheme("test-salon-a", "beauty", new Set());
assert(
  first.paletteId === second.paletteId &&
    first.fontPairingId === second.fontPairingId,
  "same slug should produce the same theme",
);

console.log("== assignTheme unique combos ==");
const used = new Set<string>();
const assigned = new Set<string>();

for (const slug of [
  "alpha-salon",
  "beta-salon",
  "gamma-salon",
  "delta-salon",
  "epsilon-salon",
]) {
  const theme = assignTheme(slug, "beauty", used);
  const key = `${theme.paletteId}::${theme.fontPairingId}`;
  assert(!assigned.has(key), `duplicate combo assigned for ${slug}`);
  assigned.add(key);
  used.add(key);
}

console.log("== assignTheme collision avoidance ==");
const blocked = new Set(["warm-earth::manrope-bodoni"]);
const avoided = assignTheme("warm-earth-test", "beauty", blocked);
assert(
  `${avoided.paletteId}::${avoided.fontPairingId}` !== "warm-earth::manrope-bodoni",
  "collision avoidance should skip used palette/font pairs",
);

console.log("== resolveThemeCssVars ==");
const vars = resolveThemeCssVars(first, "beauty");
assert(vars !== undefined, "theme vars should resolve for beauty appearance");

for (const cssVar of THEME_CSS_VAR_NAMES) {
  assert(
    typeof vars?.[cssVar as keyof typeof vars] === "string",
    `missing css var ${cssVar}`,
  );
}

console.log("== accent contrast ==");
const palette = getPalette(first.paletteId);
assert(palette !== undefined, "assigned palette should exist");
const tokens = paletteToTokens(palette!);
assert(
  contrastForeground(tokens.accent) === tokens.accentForeground,
  "accent foreground should be contrast-safe",
);

console.log("== legacy fallback ==");
assert(
  resolveThemeCssVars(undefined, "beauty") === undefined,
  "legacy sites without theme should not inject css vars",
);

console.log("\nAll theme tests passed.");
