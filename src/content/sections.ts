import type { SiteConfig } from "./types/site";

/** Missing / undefined section flags default to false for legacy site.json files. */
export function isGallerySectionVisible(config: SiteConfig): boolean {
  return (
    config.sections?.gallery === true &&
    (config.gallery?.items?.length ?? 0) > 0
  );
}

export function isPricingSectionVisible(config: SiteConfig): boolean {
  return (
    config.sections?.pricing === true &&
    (config.pricing?.items?.length ?? 0) > 0
  );
}

/** Flag only — content gating lives in section-data helpers. */
export function isBenefitsSectionFlagEnabled(config: SiteConfig): boolean {
  return config.sections?.benefits === true;
}

export function isProcessSectionFlagEnabled(config: SiteConfig): boolean {
  return config.sections?.process === true;
}

export function isFinalCtaSectionFlagEnabled(config: SiteConfig): boolean {
  return config.sections?.finalCta === true;
}
