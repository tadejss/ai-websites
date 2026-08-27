import type { BusinessInput } from "@/ai/types";
import type { SiteConfig, SiteImage, SiteImages } from "@/content/types/site";
import { buildImageSearchPlan } from "./build-search-queries";
import {
  downloadStockPhoto,
  isStockPhotoConfigured,
} from "./download-stock-photo";
import type { ImageSlot } from "./types";

async function fetchSlotImage(
  slug: string,
  slot: ImageSlot,
  plan: Awaited<ReturnType<typeof buildImageSearchPlan>>,
  excludeIds: Set<string>,
): Promise<SiteImage | undefined> {
  const brief = plan[slot];
  const resolved = await downloadStockPhoto(brief, slot, slug, excludeIds);

  if (!resolved) {
    return undefined;
  }

  excludeIds.add(`${resolved.provider}:${resolved.sourceId}`);

  return {
    src: resolved.src,
    srcFallback: resolved.srcFallback,
    alt: brief.alt,
    width: resolved.width,
    height: resolved.height,
    format: resolved.format,
    fallbackFormat: resolved.fallbackFormat,
    provider: resolved.provider,
    sourceId: resolved.sourceId,
    sourceUrl: resolved.sourceUrl,
    photographer: resolved.photographer,
    photographerUrl: resolved.photographerUrl,
    searchQuery: resolved.searchQuery,
  };
}

export async function generateSiteImages(
  slug: string,
  businessInput: BusinessInput,
  siteConfig: SiteConfig,
): Promise<SiteImages | undefined> {
  if (!isStockPhotoConfigured()) {
    console.warn(
      "Neither PEXELS_API_KEY nor UNSPLASH_ACCESS_KEY is configured; skipping image generation.",
    );
    return undefined;
  }

  try {
    const plan = await buildImageSearchPlan(businessInput, siteConfig);
    const excludeIds = new Set<string>();

    const hero = await fetchSlotImage(slug, "hero", plan, excludeIds);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const services = await fetchSlotImage(slug, "services", plan, excludeIds);

    if (!hero || !services) {
      console.warn(
        `Image generation incomplete for "${slug}"; keeping placeholders.`,
      );
      return undefined;
    }

    console.log(
      `Images for ${slug}: hero by ${hero.photographer} (${hero.provider}/${hero.sourceId}), services by ${services.photographer} (${services.provider}/${services.sourceId})`,
    );

    return { hero, services };
  } catch (error) {
    console.warn(
      `Image generation failed for "${slug}"; keeping placeholders.`,
      error instanceof Error ? error.message : error,
    );
    return undefined;
  }
}
