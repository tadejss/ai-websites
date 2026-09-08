import type { AppearanceId } from "@/content/types/site";
import type { ImagePoolCategoryId } from "@/images/image-pool-category";
import type { TemplateId, TemplateProfile } from "./types";

const BEAUTY: TemplateProfile = {
  allowed: ["floating", "outlined"],
  preferred: ["floating", "outlined"],
  imageHeavy: true,
  typographyHeavy: false,
};

const TRADE: TemplateProfile = {
  allowed: ["bento", "outlined"],
  preferred: ["bento"],
  imageHeavy: false,
  typographyHeavy: false,
};

const AUTO: TemplateProfile = {
  allowed: ["outlined", "bento"],
  preferred: ["outlined", "bento"],
  imageHeavy: false,
  typographyHeavy: false,
};

const CLEANING: TemplateProfile = {
  allowed: ["bento", "type"],
  preferred: ["bento"],
  imageHeavy: false,
  typographyHeavy: false,
};

const FALLBACK: TemplateProfile = {
  allowed: ["type", "bento"],
  preferred: ["type"],
  imageHeavy: false,
  typographyHeavy: true,
};

export const CATEGORY_TEMPLATE_PROFILES: Record<
  ImagePoolCategoryId,
  TemplateProfile
> = {
  frizerji: BEAUTY,
  kozmeticarji: BEAUTY,
  "nohti-pedikura": BEAUTY,
  "maserji-wellness": BEAUTY,
  elektricarji: TRADE,
  "vodovodarji-ogrevanje": TRADE,
  keramicarji: TRADE,
  slikopleskarji: TRADE,
  suhomontazerji: TRADE,
  "mizarji-tesarji": TRADE,
  "parketarji-talne-obloge": TRADE,
  gradbinci: TRADE,
  vulkanizerji: AUTO,
  avtomehaniki: AUTO,
  "avtokleparji-licarji": AUTO,
  "cistilni-servisi": CLEANING,
};

export function templateProfile(
  categoryId: ImagePoolCategoryId | null | undefined,
): TemplateProfile {
  if (!categoryId) {
    return FALLBACK;
  }
  return CATEGORY_TEMPLATE_PROFILES[categoryId] ?? FALLBACK;
}

/** Map legacy appearance shells to a nearest new template. */
export function templateFromLegacyAppearance(
  appearance: AppearanceId | undefined,
): TemplateId {
  switch (appearance) {
    case "beauty":
    case "health":
      return "floating";
    case "elektro":
    case "construction":
    case "cleaning":
      return "bento";
    case "auto":
      return "outlined";
    case "zbrendiraj":
      return "type";
    case "default":
    default:
      return "type";
  }
}
