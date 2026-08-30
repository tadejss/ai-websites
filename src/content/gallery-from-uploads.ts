import type { OnboardingImage } from "@/onboarding/types";
import type { GalleryItem, GallerySectionConfig } from "./types/site";

/**
 * Maps onboarding Blob uploads into gallery items for a future factory/apply step.
 * Does not invent images — empty input yields empty items.
 */
export function galleryItemsFromUploads(
  images: OnboardingImage[] | null | undefined,
): GalleryItem[] {
  if (!images?.length) {
    return [];
  }

  return images
    .filter((image) => image.kind === "photo" || image.kind === "logo")
    .map((image) => ({
      src: image.url,
      alt: image.fileName?.trim() || "Fotografija podjetja",
      caption: image.fileName?.trim() || undefined,
    }));
}

export function buildGalleryFromUploads(
  images: OnboardingImage[] | null | undefined,
  partial?: Partial<GallerySectionConfig>,
): GallerySectionConfig {
  return {
    id: partial?.id ?? "galerija",
    eyebrow: partial?.eyebrow ?? "Galerija",
    title: partial?.title ?? "Vpogled v naše delo",
    description: partial?.description,
    items: galleryItemsFromUploads(images),
  };
}
