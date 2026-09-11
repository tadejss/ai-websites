import type { ImagePoolCategoryId } from "@/images/image-pool-category";

/**
 * Generation defaults for optional demo sections.
 * Never force empty sections at render — flags are applied only when content exists.
 */
export type SectionProfile = {
  benefits: boolean;
  process: boolean;
  /** Prefer when BusinessInput.serviceArea is non-empty; still content-gated. */
  serviceArea: boolean;
  finalCta: boolean;
};

const TRADE_AUTO: SectionProfile = {
  benefits: true,
  process: true,
  serviceArea: true,
  finalCta: true,
};

const BEAUTY: SectionProfile = {
  benefits: true,
  process: true,
  serviceArea: true,
  finalCta: true,
};

const CLEANING: SectionProfile = {
  benefits: true,
  process: true,
  serviceArea: true,
  finalCta: true,
};

const FALLBACK: SectionProfile = {
  benefits: true,
  process: true,
  serviceArea: false,
  finalCta: true,
};

export const CATEGORY_SECTION_PROFILES: Record<
  ImagePoolCategoryId,
  SectionProfile
> = {
  frizerji: BEAUTY,
  kozmeticarji: BEAUTY,
  "nohti-pedikura": BEAUTY,
  "maserji-wellness": BEAUTY,
  elektricarji: TRADE_AUTO,
  "vodovodarji-ogrevanje": TRADE_AUTO,
  keramicarji: TRADE_AUTO,
  slikopleskarji: TRADE_AUTO,
  suhomontazerji: TRADE_AUTO,
  "mizarji-tesarji": TRADE_AUTO,
  "parketarji-talne-obloge": TRADE_AUTO,
  gradbinci: TRADE_AUTO,
  vulkanizerji: TRADE_AUTO,
  avtomehaniki: TRADE_AUTO,
  "avtokleparji-licarji": TRADE_AUTO,
  "cistilni-servisi": CLEANING,
};

export function sectionProfile(
  categoryId: ImagePoolCategoryId | null | undefined,
): SectionProfile {
  if (!categoryId) {
    return FALLBACK;
  }
  return CATEGORY_SECTION_PROFILES[categoryId] ?? FALLBACK;
}
