import { assignLook } from "../src/catalog/assign-look";
import { pricingCardClassForLook } from "../src/catalog/look-styles";
import { resolveLookForSite } from "../src/catalog/resolve-look";
import { resolveLookCssVars } from "../src/catalog/resolve-look-css";
import { allLooks } from "../src/catalog/looks";
import { resolveThemeCssVars } from "../src/theme/resolve-theme";
import { THEME_CSS_VAR_NAMES } from "../src/theme/types";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

console.log("== assignLook deterministic ==");
const first = assignLook("frizerji", "test-salon-a", new Set());
const second = assignLook("frizerji", "test-salon-a", new Set());
assert(first.id === second.id, "same slug should produce same look");

console.log("== assignLook collision avoidance ==");
const used = new Set<string>([first.id]);
const next = assignLook("frizerji", "test-salon-b", used);
assert(next.id !== first.id, "should avoid used look id when possible");

console.log("== resolveLookCssVars ==");
const vars = resolveLookCssVars(first);
for (const cssVar of THEME_CSS_VAR_NAMES) {
  assert(
    typeof vars[cssVar as keyof typeof vars] === "string",
    `missing css var ${cssVar} for look`,
  );
}

console.log("== backward compat ==");
assert(
  resolveThemeCssVars(undefined, "beauty") === undefined,
  "legacy sites without theme should not inject css vars",
);
assert(
  resolveLookForSite({} as never) === undefined,
  "sites without lookId should not resolve look",
);

console.log("== approved look count ==");
const approved = allLooks.filter((look) => look.status === "approved");
assert(approved.length === 160, `expected 160 approved looks, got ${approved.length}`);

console.log("== radiusButton tokens ==");
const sharpLook = allLooks.find((look) => look.designTokens.radiusScale === "sharp");
const pillLook = allLooks.find((look) => look.designTokens.radiusScale === "pill");
const noneCardLook = allLooks.find(
  (look) => look.designTokens.cardTreatment === "none",
);
assert(sharpLook !== undefined && pillLook !== undefined, "need sharp and pill looks");
assert(noneCardLook !== undefined, "need a look with cardTreatment none");
assert(
  sharpLook.designTokens.radiusButton !== pillLook.designTokens.radiusButton,
  "sharp and pill looks should differ on radiusButton",
);
assert(
  pricingCardClassForLook(noneCardLook.designTokens).includes("p-6"),
  "pricing cards should keep padding when cardTreatment is none",
);
const sharpVars = resolveLookCssVars(sharpLook);
assert(
  sharpVars["--radius-button"] === sharpLook.designTokens.radiusButton,
  "--radius-button css var should match design token",
);

console.log("\nAll catalog tests passed.");
