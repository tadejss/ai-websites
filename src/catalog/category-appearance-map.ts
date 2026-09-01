import type { ImagePoolCategoryId } from "@/images/image-pool-category";
import type { AppearanceId } from "@/content/types/site";

/** Default appearance per image-pool category (factory catalog). */
export const CATEGORY_APPEARANCE_MAP: Record<ImagePoolCategoryId, AppearanceId> =
  {
    frizerji: "beauty",
    kozmeticarji: "beauty",
    "nohti-pedikura": "beauty",
    "maserji-wellness": "health",
    elektricarji: "elektro",
    vulkanizerji: "auto",
    avtomehaniki: "auto",
    "avtokleparji-licarji": "auto",
    keramicarji: "construction",
    slikopleskarji: "construction",
    suhomontazerji: "construction",
    "mizarji-tesarji": "construction",
    "parketarji-talne-obloge": "construction",
    gradbinci: "construction",
    "cistilni-servisi": "cleaning",
    /** Plumbing/heating — trade visual language closer to construction. */
    "vodovodarji-ogrevanje": "construction",
  };

export function appearanceForCategory(
  categoryId: ImagePoolCategoryId,
): AppearanceId {
  return CATEGORY_APPEARANCE_MAP[categoryId];
}
