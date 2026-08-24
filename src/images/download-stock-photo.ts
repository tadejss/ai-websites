import type { ImageSearchBrief } from "./types";
import {
  downloadPexelsPhoto,
  isPexelsConfigured,
} from "./providers/pexels";
import {
  downloadUnsplashPhoto,
  isUnsplashConfigured,
} from "./providers/unsplash";

export type DownloadedPhoto = {
  data: Buffer;
  photographer: string;
  provider: "unsplash" | "pexels";
};

/** True when at least one stock photo provider is configured. */
export function isAnyImageProviderConfigured(): boolean {
  return isPexelsConfigured() || isUnsplashConfigured();
}

/**
 * Prefer Pexels; fall back to Unsplash when Pexels is missing, rate-limited,
 * or returns no usable photo.
 */
export async function downloadStockPhoto(
  brief: ImageSearchBrief,
  slot: "hero" | "services",
): Promise<DownloadedPhoto | undefined> {
  if (isPexelsConfigured()) {
    try {
      const pexels = await downloadPexelsPhoto(brief, slot);

      if (pexels) {
        return { ...pexels, provider: "pexels" };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Pexels failed (${message}); trying Unsplash.`);
    }
  }

  if (isUnsplashConfigured()) {
    const unsplash = await downloadUnsplashPhoto(brief, slot);

    if (unsplash) {
      return { ...unsplash, provider: "unsplash" };
    }
  }

  return undefined;
}
