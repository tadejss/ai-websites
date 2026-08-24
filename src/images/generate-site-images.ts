import type { BusinessInput } from "@/ai/types";
import type { SiteConfig, SiteImages } from "@/content/types/site";
import { buildImageSearchPlan } from "./build-search-queries";
import {
  downloadStockPhoto,
  isAnyImageProviderConfigured,
} from "./download-stock-photo";
import { saveClientImage } from "./save-client-image";
import type { ImageSlot } from "./types";

async function fetchSlotImage(
  slug: string,
  slot: ImageSlot,
  plan: Awaited<ReturnType<typeof buildImageSearchPlan>>,
): Promise<{ src: string; alt: string; photographer?: string } | undefined> {
  const brief = plan[slot];
  const downloaded = await downloadStockPhoto(brief, slot);

  if (!downloaded) {
    return undefined;
  }

  const src = saveClientImage(slug, slot, downloaded.data);

  return {
    src,
    alt: brief.alt,
    photographer: downloaded.photographer,
  };
}

export async function generateSiteImages(
  slug: string,
  businessInput: BusinessInput,
  siteConfig: SiteConfig,
): Promise<SiteImages | undefined> {
  if (!isAnyImageProviderConfigured()) {
    console.warn(
      "Neither PEXELS_API_KEY nor UNSPLASH_ACCESS_KEY is configured; skipping image generation.",
    );
    return undefined;
  }

  const plan = await buildImageSearchPlan(businessInput, siteConfig);
  const hero = await fetchSlotImage(slug, "hero", plan);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const services = await fetchSlotImage(slug, "services", plan);

  if (!hero || !services) {
    console.warn(`Image generation incomplete for "${slug}"; keeping placeholders.`);
    return undefined;
  }

  console.log(
    `Images for ${slug}: hero by ${hero.photographer}, services by ${services.photographer}`,
  );

  return {
    hero: { src: hero.src, alt: hero.alt },
    services: { src: services.src, alt: services.alt },
  };
}
