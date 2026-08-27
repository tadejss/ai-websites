import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  getCachedStockAsset,
  putCachedStockAsset,
  type CachedStockAsset,
} from "./asset-cache";
import { optimizeStockImage } from "./optimize-image";
import {
  downloadPexelsPhoto,
  isPexelsConfigured,
} from "./providers/pexels";
import {
  downloadUnsplashPhoto,
  isUnsplashConfigured,
} from "./providers/unsplash";
import type { StockPhotoCandidate } from "./providers/types";
import { storeClientImages, storeStockImages } from "./storage";
import type { ImageSearchBrief, ImageSlot } from "./types";

export type ResolvedStockImage = {
  src: string;
  srcFallback: string;
  width: number;
  height: number;
  format: "avif";
  fallbackFormat: "webp";
  provider: StockPhotoCandidate["provider"];
  sourceId: string;
  sourceUrl: string;
  photographer: string;
  photographerUrl?: string;
  searchQuery: string;
  fromCache: boolean;
};

function assetKey(provider: string, id: string): string {
  return `${provider}:${id}`;
}

async function readStoredBuffer(urlOrPath: string): Promise<Buffer | undefined> {
  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
    try {
      const response = await fetch(urlOrPath);
      if (!response.ok) {
        return undefined;
      }
      return Buffer.from(await response.arrayBuffer());
    } catch {
      return undefined;
    }
  }

  const relative = urlOrPath.startsWith("/") ? urlOrPath.slice(1) : urlOrPath;
  try {
    return await readFile(path.join(process.cwd(), "public", relative));
  } catch {
    return undefined;
  }
}

async function copyCacheToClient(
  slug: string,
  slot: ImageSlot,
  cached: CachedStockAsset,
): Promise<{ src: string; srcFallback: string } | undefined> {
  const [avif, webp] = await Promise.all([
    readStoredBuffer(cached.src),
    readStoredBuffer(cached.srcFallback),
  ]);

  if (!avif || !webp) {
    return undefined;
  }

  return storeClientImages({
    slug,
    slot,
    avif,
    webp,
  });
}

async function persistCandidate(
  data: Buffer,
  candidate: StockPhotoCandidate,
  slot: ImageSlot,
  slug: string,
): Promise<ResolvedStockImage> {
  const cached = await getCachedStockAsset(candidate.provider, candidate.id);
  if (cached) {
    const clientUrls =
      (await copyCacheToClient(slug, slot, cached)) ?? {
        src: cached.src,
        srcFallback: cached.srcFallback,
      };

    return {
      src: clientUrls.src,
      srcFallback: clientUrls.srcFallback,
      width: cached.width,
      height: cached.height,
      format: cached.format,
      fallbackFormat: cached.fallbackFormat,
      provider: cached.provider,
      sourceId: cached.id,
      sourceUrl: cached.sourceUrl,
      photographer: cached.photographer,
      photographerUrl: cached.photographerUrl,
      searchQuery: candidate.searchQuery,
      fromCache: true,
    };
  }

  const optimized = await optimizeStockImage(data, slot);
  const [stock, client] = await Promise.all([
    storeStockImages({
      provider: candidate.provider,
      id: candidate.id,
      avif: optimized.avif,
      webp: optimized.webp,
    }),
    storeClientImages({
      slug,
      slot,
      avif: optimized.avif,
      webp: optimized.webp,
    }),
  ]);

  const asset: CachedStockAsset = {
    provider: candidate.provider,
    id: candidate.id,
    src: stock.src,
    srcFallback: stock.srcFallback,
    width: optimized.width,
    height: optimized.height,
    format: "avif",
    fallbackFormat: "webp",
    sourceUrl: candidate.sourceUrl,
    photographer: candidate.photographer,
    photographerUrl: candidate.photographerUrl,
    searchQuery: candidate.searchQuery,
    storedAt: new Date().toISOString(),
  };
  await putCachedStockAsset(asset);

  return {
    src: client.src,
    srcFallback: client.srcFallback,
    width: optimized.width,
    height: optimized.height,
    format: "avif",
    fallbackFormat: "webp",
    provider: candidate.provider,
    sourceId: candidate.id,
    sourceUrl: candidate.sourceUrl,
    photographer: candidate.photographer,
    photographerUrl: candidate.photographerUrl,
    searchQuery: candidate.searchQuery,
    fromCache: false,
  };
}

/**
 * Fetch one stock photo: Pexels → Unsplash → undefined.
 * Dedupes by provider:id via asset cache; skips excludeIds within a run.
 * Writes optimized AVIF+WebP to storage (Blob or public/).
 */
export async function downloadStockPhoto(
  brief: ImageSearchBrief,
  slot: ImageSlot,
  slug: string,
  excludeIds: Set<string> = new Set(),
): Promise<ResolvedStockImage | undefined> {
  if (isPexelsConfigured()) {
    try {
      const result = await downloadPexelsPhoto(brief, slot, excludeIds);
      if (result) {
        const key = assetKey(result.candidate.provider, result.candidate.id);
        if (!excludeIds.has(key)) {
          return persistCandidate(result.data, result.candidate, slot, slug);
        }
      }
    } catch (error) {
      console.warn(
        `Pexels failed for "${brief.query}" (${slot}):`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  if (isUnsplashConfigured()) {
    try {
      const result = await downloadUnsplashPhoto(brief, slot, excludeIds);
      if (result) {
        return persistCandidate(result.data, result.candidate, slot, slug);
      }
    } catch (error) {
      console.warn(
        `Unsplash failed for "${brief.query}" (${slot}):`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return undefined;
}

export function isStockPhotoConfigured(): boolean {
  return isPexelsConfigured() || isUnsplashConfigured();
}

/** @deprecated Use isStockPhotoConfigured */
export const isAnyImageProviderConfigured = isStockPhotoConfigured;
