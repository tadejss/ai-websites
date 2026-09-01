import { IMAGE_POOL_CATEGORY_IDS } from "@/images/image-pool-category";
import { appearanceForCategory } from "@/catalog/category-appearance-map";
import type { FontPairing } from "@/theme/types";
import { buildCategoryFontPairings } from "./build-pairings";

function categoryAppearanceMode(
  categoryId: (typeof IMAGE_POOL_CATEGORY_IDS)[number],
): "beauty" | "trade" {
  return appearanceForCategory(categoryId) === "beauty" ? "beauty" : "trade";
}

export const catalogFontPairings: FontPairing[] = IMAGE_POOL_CATEGORY_IDS.flatMap(
  (categoryId) =>
    buildCategoryFontPairings(categoryId, categoryAppearanceMode(categoryId)),
);

const pairingById = new Map(
  catalogFontPairings.map((pairing) => [pairing.id, pairing]),
);

export function getCatalogFontPairing(id: string): FontPairing | undefined {
  return pairingById.get(id);
}

export const catalogFontPairingIds = catalogFontPairings.map(
  (pairing) => pairing.id,
);
