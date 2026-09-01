import { IMAGE_POOL_CATEGORY_IDS } from "@/images/image-pool-category";
import { appearanceForCategory } from "@/catalog/category-appearance-map";
import { isTradeAppearance } from "@/appearances/types";
import type { Palette } from "@/theme/types";
import { generateAllCatalogPalettes } from "./generate-palettes";

function categoryAppearanceMode(
  categoryId: (typeof IMAGE_POOL_CATEGORY_IDS)[number],
): "beauty" | "trade" {
  const appearance = appearanceForCategory(categoryId);
  return appearance === "beauty" ? "beauty" : "trade";
}

export const catalogPalettes: Palette[] = generateAllCatalogPalettes(
  [...IMAGE_POOL_CATEGORY_IDS],
  categoryAppearanceMode,
);

const paletteById = new Map(catalogPalettes.map((palette) => [palette.id, palette]));

export function getCatalogPalette(id: string): Palette | undefined {
  return paletteById.get(id);
}

export const catalogPaletteIds = catalogPalettes.map((palette) => palette.id);
