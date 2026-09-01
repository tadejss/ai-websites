import { IMAGE_POOL_CATEGORY_IDS } from "../src/images/image-pool-category";
import { allLooks, getLooksForCategory } from "../src/catalog/looks";
import { validateLookContrast, validateLookUniqueness } from "../src/catalog/contrast/validate-look";
import { getCatalogPalette } from "../src/catalog/palettes";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

console.log("== catalog registry ==");
assert(allLooks.length === 160, `expected 160 looks, got ${allLooks.length}`);

for (const categoryId of IMAGE_POOL_CATEGORY_IDS) {
  const looks = getLooksForCategory(categoryId);
  assert(looks.length === 10, `${categoryId}: expected 10 looks, got ${looks.length}`);

  const uniqueness = validateLookUniqueness(looks);
  assert(uniqueness.ok, `${categoryId}: ${uniqueness.errors.join("; ")}`);
}

console.log("== palette contrast ==");
let contrastFailures = 0;

for (const look of allLooks) {
  if (look.status !== "approved") {
    continue;
  }

  const result = validateLookContrast(look);
  if (!result.ok) {
    contrastFailures += 1;
    console.error(
      `${look.id}: ${result.failures.map((f) => `${f.pair} ${f.ratio}<${f.required}`).join(", ")}`,
    );
  }

  assert(
    getCatalogPalette(look.theme.paletteId) !== undefined,
    `${look.id}: missing palette ${look.theme.paletteId}`,
  );
}

assert(contrastFailures === 0, `${contrastFailures} looks failed contrast validation`);

console.log("\nCatalog validation passed.");
