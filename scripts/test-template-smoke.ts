/**
 * Smoke: ensure template pages are importable and geometry hooks differ.
 * Not a visual screenshot runner — use browser QA for the matrix.
 */
import { templateRegistry } from "../src/templates/registry";
import { TEMPLATE_IDS } from "../src/templates/types";
import { getTemplateImagePlan } from "../src/templates/image-plan";
import { resolveTemplateTokens } from "../src/templates/tokens";

let failures = 0;
function ok(c: boolean, label: string) {
  if (!c) failures += 1;
  console.log(`${c ? "PASS" : "FAIL"}  ${label}`);
}

console.log("== registry ==");
for (const id of TEMPLATE_IDS) {
  ok(Boolean(templateRegistry[id]?.Page), `${id} page registered`);
  ok(Boolean(getTemplateImagePlan(id).heroRole), `${id} image plan`);
  const tokens = resolveTemplateTokens(id);
  ok(Boolean(tokens.accent && tokens.background), `${id} tokens`);
}

ok(
  getTemplateImagePlan("bento").serviceRole === "service-thumb",
  "bento uses service thumbs",
);
ok(
  getTemplateImagePlan("type").serviceRole === "service-none",
  "type skips service imagery",
);
ok(
  getTemplateImagePlan("floating").preferPortraitHero === true,
  "floating prefers portrait hero",
);
ok(templateRegistry.type.stickyPhoneBar === false, "type has no sticky bar");
ok(templateRegistry.bento.stickyPhoneBar === false, "bento has no sticky bar");
ok(
  TEMPLATE_IDS.every((id) => templateRegistry[id].stickyPhoneBar === false),
  "no template uses sticky phone bar",
);

// Distinct token signatures (not merely same palette)
const backgrounds = new Set(
  TEMPLATE_IDS.map((id) => resolveTemplateTokens(id).background),
);
ok(backgrounds.size >= 4, "distinct background colors");

if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nTemplate smoke passed.");
