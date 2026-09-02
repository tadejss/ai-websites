/** Published reference demos linked from zbrendiraj.si primere section. */
export const SHOWCASE_REFERENCE_SLUGS = [
  "frizerski-salon-luna",
  "keramicarstvo-hribar",
  "elektro-instalacije-kovac",
  "krovstvo-petek",
] as const;

export type ShowcaseReferenceSlug = (typeof SHOWCASE_REFERENCE_SLUGS)[number];

export function isShowcaseReferenceSlug(slug: string): boolean {
  return (SHOWCASE_REFERENCE_SLUGS as readonly string[]).includes(
    slug.trim().toLowerCase(),
  );
}
