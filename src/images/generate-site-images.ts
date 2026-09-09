import type { BusinessInput } from "@/ai/types";
import type {
  GalleryItem,
  SiteConfig,
  SiteImage,
  SiteImages,
} from "@/content/types/site";
import type { TemplateImagePlan } from "@/templates/types";
import { buildImageSearchPlan } from "./build-search-queries";
import {
  downloadStockPhoto,
  isStockPhotoConfigured,
} from "./download-stock-photo";
import { generateImagesFromPool } from "./image-pool";
import { resolveImagePoolCategory } from "./image-pool-category";
import { MIN_DEMO_SITE_IMAGES } from "./image-pool-config";
import type { ImageSlot } from "./types";

export type GeneratedSiteMedia = {
  images: SiteImages;
  galleryItems: GalleryItem[];
};

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

function toSiteImage(
  assigned: {
    src: string;
    srcFallback: string;
    width: number;
    height: number;
    provider: string;
    sourceId: string;
    sourceUrl: string;
    photographer: string;
    photographerUrl?: string;
    searchQuery: string;
  },
  alt: string,
): SiteImage {
  return {
    src: assigned.src,
    srcFallback: assigned.srcFallback,
    alt,
    width: assigned.width,
    height: assigned.height,
    format: "avif",
    fallbackFormat: "webp",
    provider: assigned.provider as SiteImage["provider"],
    sourceId: assigned.sourceId,
    sourceUrl: assigned.sourceUrl,
    photographer: assigned.photographer,
    photographerUrl: assigned.photographerUrl,
    searchQuery: assigned.searchQuery,
  };
}

function toGalleryItem(image: SiteImage): GalleryItem {
  return {
    src: image.srcFallback || image.src,
    alt: image.alt,
  };
}

export async function generateSiteImages(
  slug: string,
  businessInput: BusinessInput,
  siteConfig: SiteConfig,
  options?: { imagePlan?: TemplateImagePlan },
): Promise<GeneratedSiteMedia | undefined> {
  if (!isStockPhotoConfigured()) {
    console.warn(
      "Neither PEXELS_API_KEY nor UNSPLASH_ACCESS_KEY is configured; skipping image generation.",
    );
    return undefined;
  }

  const skipServiceFetch = options?.imagePlan?.serviceRole === "service-none";
  const preferPortraitHero = options?.imagePlan?.preferPortraitHero !== false;

  try {
    const plan = await buildImageSearchPlan(businessInput, siteConfig);
    if (!preferPortraitHero) {
      plan.hero.orientation = "landscape";
    }

    const category = resolveImagePoolCategory({
      industry: businessInput.industry,
      companyName: businessInput.companyName,
    });

    if (category) {
      const pooled = await generateImagesFromPool(category, slug);

      if (pooled?.hero) {
        const hero = toSiteImage(pooled.hero, plan.hero.alt);
        const servicesSource =
          !skipServiceFetch && pooled.services ? pooled.services : pooled.hero;
        const services = toSiteImage(servicesSource, plan.services.alt);
        const galleryItems: GalleryItem[] = pooled.gallery.map((item) => ({
          src: item.srcFallback || item.src,
          alt: item.alt || plan.hero.alt,
        }));

        while (galleryItems.length < MIN_DEMO_SITE_IMAGES) {
          galleryItems.push(toGalleryItem(hero));
          if (galleryItems.length >= MIN_DEMO_SITE_IMAGES) break;
          galleryItems.push(toGalleryItem(services));
        }

        console.log(
          `Images for ${slug} [pool:${category}]: hero by ${hero.photographer} (${hero.provider}/${hero.sourceId}), services by ${services.photographer} (${services.provider}/${services.sourceId}), gallery ${galleryItems.length}`,
        );

        return {
          images: { hero, services },
          galleryItems: galleryItems.slice(0, Math.max(MIN_DEMO_SITE_IMAGES, galleryItems.length)),
        };
      }

      console.warn(
        `Pool image generation incomplete for "${slug}" (${category}); falling back to direct fetch.`,
      );
    }

    const excludeIds = new Set<string>();
    const fetched: SiteImage[] = [];

    const hero = await fetchSlotImage(slug, "hero", plan, excludeIds);
    if (hero) fetched.push(hero);

    let services: SiteImage | undefined;
    if (!skipServiceFetch) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      services = await fetchSlotImage(slug, "services", plan, excludeIds);
      if (services) fetched.push(services);
    } else if (hero) {
      services = { ...hero, alt: plan.services.alt };
    }

    while (fetched.length < MIN_DEMO_SITE_IMAGES && hero) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const extra = await fetchSlotImage(slug, "services", plan, excludeIds);
      if (!extra) break;
      fetched.push(extra);
    }

    if (!hero || !services) {
      console.warn(
        `Image generation incomplete for "${slug}"; keeping placeholders.`,
      );
      return undefined;
    }

    const galleryItems = fetched.map(toGalleryItem);
    while (galleryItems.length < MIN_DEMO_SITE_IMAGES) {
      galleryItems.push(toGalleryItem(hero));
    }

    console.log(
      `Images for ${slug}: hero by ${hero.photographer} (${hero.provider}/${hero.sourceId}), services by ${services.photographer} (${services.provider}/${services.sourceId}), gallery ${galleryItems.length}`,
    );

    return {
      images: { hero, services },
      galleryItems: galleryItems.slice(0, Math.max(MIN_DEMO_SITE_IMAGES, galleryItems.length)),
    };
  } catch (error) {
    console.warn(
      `Image generation failed for "${slug}"; keeping placeholders.`,
      error instanceof Error ? error.message : error,
    );
    return undefined;
  }
}
