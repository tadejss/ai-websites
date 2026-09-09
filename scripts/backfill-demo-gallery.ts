/**
 * Append-only backfill so every demo has >= MIN_DEMO_SITE_IMAGES usable refs
 * (hero + services + gallery.items). Preserves all valid existing assignments.
 *
 * Usage:
 *   npm run backfill-demo-gallery -- --dry-run
 *   npm run backfill-demo-gallery
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeGallerySection } from "../src/content/apply-new-lead-sections";
import type {
  GalleryItem,
  SiteConfig,
  SiteImage,
} from "../src/content/types/site";
import { validateSiteConfig } from "../src/content/validate-site-config";
import {
  assetCacheKey,
  readAssetCache,
  type CachedStockAssetRecord,
} from "../src/images/asset-cache";
import {
  resolveImagePoolCategory,
  type ImagePoolCategoryId,
} from "../src/images/image-pool-category";
import { MIN_DEMO_SITE_IMAGES } from "../src/images/image-pool-config";
import { selectPoolAssets } from "../src/images/image-pool";

const dryRun = process.argv.includes("--dry-run");
const verbose = process.argv.includes("--verbose");

function getClientsDir(): string {
  return resolve(process.cwd(), "src/content/clients");
}

function hasUsableSrc(src?: string | null): boolean {
  return typeof src === "string" && src.trim().length > 0;
}

function countUsableImages(site: SiteConfig): {
  usable: number;
  hero: boolean;
  services: boolean;
  galleryValid: number;
  galleryInvalid: number;
} {
  const hero = hasUsableSrc(site.images?.hero?.src);
  const services = hasUsableSrc(site.images?.services?.src);
  let galleryValid = 0;
  let galleryInvalid = 0;
  for (const item of site.gallery?.items ?? []) {
    if (hasUsableSrc(item?.src)) {
      galleryValid += 1;
    } else {
      galleryInvalid += 1;
    }
  }
  return {
    usable: (hero ? 1 : 0) + (services ? 1 : 0) + galleryValid,
    hero,
    services,
    galleryValid,
    galleryInvalid,
  };
}

function collectUsedKeys(
  site: SiteConfig,
  assetsByUrl: Map<string, string>,
): Set<string> {
  const keys = new Set<string>();

  for (const slot of ["hero", "services"] as const) {
    const image = site.images?.[slot];
    if (!image) continue;
    if (image.provider && image.sourceId) {
      keys.add(assetCacheKey(image.provider, image.sourceId));
    }
    if (hasUsableSrc(image.src)) {
      const key = assetsByUrl.get(image.src);
      if (key) keys.add(key);
    }
    if (hasUsableSrc(image.srcFallback)) {
      const key = assetsByUrl.get(image.srcFallback!);
      if (key) keys.add(key);
    }
  }

  for (const item of site.gallery?.items ?? []) {
    if (!hasUsableSrc(item?.src)) continue;
    const key = assetsByUrl.get(item.src);
    if (key) keys.add(key);
  }

  return keys;
}

function buildUrlIndex(
  assets: Record<string, CachedStockAssetRecord>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const [key, asset] of Object.entries(assets)) {
    if (asset.src) map.set(asset.src, key);
    if (asset.srcFallback) map.set(asset.srcFallback, key);
  }
  return map;
}

function assetToSiteImage(asset: CachedStockAssetRecord, alt: string): SiteImage {
  return {
    src: asset.src,
    srcFallback: asset.srcFallback,
    alt,
    width: asset.width,
    height: asset.height,
    format: asset.format,
    fallbackFormat: asset.fallbackFormat,
    provider: asset.provider,
    sourceId: asset.id,
    sourceUrl: asset.sourceUrl,
    photographer: asset.photographer,
    photographerUrl: asset.photographerUrl,
    searchQuery: asset.searchQuery,
  };
}

function assetToGalleryItem(
  asset: CachedStockAssetRecord,
  alt: string,
): GalleryItem {
  return {
    src: asset.srcFallback || asset.src,
    alt,
  };
}

/**
 * Select `count` keys; prefer distinct and unused; cycle pool if too small.
 */
async function selectKeysForDemo(
  category: ImagePoolCategoryId,
  slug: string,
  count: number,
  excludeKeys: Set<string>,
): Promise<{ keys: string[]; reusedWithinDemo: boolean; poolSize: number }> {
  if (count <= 0) {
    return { keys: [], reusedWithinDemo: false, poolSize: 0 };
  }

  const distinct = await selectPoolAssets(category, slug, count, excludeKeys);
  if (distinct.length >= count) {
    return {
      keys: distinct.slice(0, count),
      reusedWithinDemo: false,
      poolSize: distinct.length,
    };
  }

  // Not enough unused distinct assets — draw from full pool (ignore exclude).
  const pool = await selectPoolAssets(category, slug, 10_000, new Set());
  if (pool.length === 0) {
    return { keys: [], reusedWithinDemo: false, poolSize: 0 };
  }

  const keys = [...distinct];
  let cursor = 0;
  while (keys.length < count) {
    keys.push(pool[cursor % pool.length]!);
    cursor += 1;
  }

  return {
    keys,
    reusedWithinDemo: true,
    poolSize: pool.length,
  };
}

type CategoryStats = {
  total: number;
  alreadyComplete: number;
  partialPlanned: number;
  emptyPlanned: number;
  galleryItemsToAdd: number;
  categoryFailures: number;
  poolWarnings: number;
};

async function main(): Promise<void> {
  const clientsDir = getClientsDir();
  const cache = await readAssetCache();
  const assetsByUrl = buildUrlIndex(cache.assets);

  let processed = 0;
  let alreadyGe6 = 0;
  let needBackfill = 0;
  let partialChanged = 0;
  let emptyChanged = 0;
  let galleryItemsToAdd = 0;
  let categoryFailures = 0;
  let poolWarnings = 0;
  let invalidImageRefs = 0;
  let clientsChanged = 0;
  let clientsSkipped = 0;
  let clientsFailed = 0;
  let ge6After = 0;
  let stillLt6 = 0;
  let withHeroAfter = 0;
  let withGalleryAfter = 0;

  const byCategory = new Map<string, CategoryStats>();

  function touchCategory(id: string): CategoryStats {
    let stats = byCategory.get(id);
    if (!stats) {
      stats = {
        total: 0,
        alreadyComplete: 0,
        partialPlanned: 0,
        emptyPlanned: 0,
        galleryItemsToAdd: 0,
        categoryFailures: 0,
        poolWarnings: 0,
      };
      byCategory.set(id, stats);
    }
    return stats;
  }

  const entries = readdirSync(clientsDir, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory(),
  );

  for (const entry of entries) {
    const slug = entry.name;
    const sitePath = resolve(clientsDir, slug, "site.json");
    const businessPath = resolve(clientsDir, slug, "business.json");

    if (!existsSync(sitePath)) {
      clientsSkipped += 1;
      continue;
    }

    processed += 1;

    try {
      const siteRaw = JSON.parse(readFileSync(sitePath, "utf8")) as SiteConfig;
      const counts = countUsableImages(siteRaw);
      invalidImageRefs += counts.galleryInvalid;

      let categoryId: ImagePoolCategoryId | undefined;
      let categoryLabel = "unresolved";

      if (existsSync(businessPath)) {
        const business = JSON.parse(readFileSync(businessPath, "utf8")) as {
          industry?: string;
          companyName?: string;
        };
        categoryId = resolveImagePoolCategory({
          industry: business.industry,
          companyName: business.companyName,
        });
        if (categoryId) categoryLabel = categoryId;
      }

      const catStats = touchCategory(categoryLabel);
      catStats.total += 1;

      if (counts.usable >= MIN_DEMO_SITE_IMAGES) {
        alreadyGe6 += 1;
        catStats.alreadyComplete += 1;
        ge6After += 1;
        if (counts.hero) withHeroAfter += 1;
        if (counts.galleryValid > 0) withGalleryAfter += 1;
        if (verbose) {
          console.log(`[skip] ${slug}: already ${counts.usable} usable`);
        }
        continue;
      }

      needBackfill += 1;

      if (!categoryId) {
        categoryFailures += 1;
        catStats.categoryFailures += 1;
        stillLt6 += 1;
        if (counts.hero) withHeroAfter += 1;
        if (counts.galleryValid > 0) withGalleryAfter += 1;
        console.warn(`[category] ${slug}: could not resolve image-pool category`);
        continue;
      }

      const needed = MIN_DEMO_SITE_IMAGES - counts.usable;
      const usedKeys = collectUsedKeys(siteRaw, assetsByUrl);
      const isEmpty = counts.usable === 0;

      let nextSite: SiteConfig = { ...siteRaw };
      let itemsAdded = 0;

      if (isEmpty) {
        // Case C: hero + services + 4 gallery
        const selection = await selectKeysForDemo(
          categoryId,
          slug,
          MIN_DEMO_SITE_IMAGES,
          new Set(),
        );

        if (selection.keys.length < MIN_DEMO_SITE_IMAGES) {
          poolWarnings += 1;
          catStats.poolWarnings += 1;
          stillLt6 += 1;
          console.warn(
            `[pool] ${slug}: category ${categoryId} has ${selection.poolSize} assets, need ${MIN_DEMO_SITE_IMAGES}`,
          );
          continue;
        }

        if (selection.reusedWithinDemo) {
          poolWarnings += 1;
          catStats.poolWarnings += 1;
        }

        const assets = selection.keys.map((key) => cache.assets[key]);
        if (assets.some((asset) => !asset)) {
          clientsFailed += 1;
          console.error(`[fail] ${slug}: missing cache asset for selected key`);
          continue;
        }

        const heroAsset = assets[0]!;
        const servicesAsset = assets[1]!;
        const galleryAssets = assets.slice(2, MIN_DEMO_SITE_IMAGES);

        const galleryItems = galleryAssets.map((asset, index) =>
          assetToGalleryItem(
            asset!,
            asset!.searchQuery || `Galerija ${index + 1}`,
          ),
        );

        const gallery =
          normalizeGallerySection({
            ...siteRaw.gallery,
            items: galleryItems,
          }) ?? normalizeGallerySection({ items: galleryItems })!;

        nextSite = {
          ...siteRaw,
          images: {
            hero: assetToSiteImage(
              heroAsset!,
              heroAsset!.searchQuery || "Storitve",
            ),
            services: assetToSiteImage(
              servicesAsset!,
              servicesAsset!.searchQuery || "Storitve",
            ),
          },
          gallery,
          sections: {
            ...siteRaw.sections,
            gallery: gallery.items.length > 0 ? true : siteRaw.sections?.gallery,
          },
        };
        itemsAdded = galleryItems.length;
        emptyChanged += 1;
        catStats.emptyPlanned += 1;
      } else {
        // Case B: append only to gallery
        const selection = await selectKeysForDemo(
          categoryId,
          slug,
          needed,
          usedKeys,
        );

        if (selection.keys.length < needed) {
          poolWarnings += 1;
          catStats.poolWarnings += 1;
          stillLt6 += 1;
          console.warn(
            `[pool] ${slug}: category ${categoryId} cannot supply ${needed} images (pool ${selection.poolSize})`,
          );
          if (counts.hero) withHeroAfter += 1;
          if (counts.galleryValid > 0) withGalleryAfter += 1;
          continue;
        }

        if (selection.reusedWithinDemo) {
          poolWarnings += 1;
          catStats.poolWarnings += 1;
        }

        const newItems: GalleryItem[] = [];
        for (const [index, key] of selection.keys.entries()) {
          const asset = cache.assets[key];
          if (!asset) {
            throw new Error(`Missing cache asset ${key}`);
          }
          newItems.push(
            assetToGalleryItem(
              asset,
              asset.searchQuery || `Galerija ${(siteRaw.gallery?.items?.length ?? 0) + index + 1}`,
            ),
          );
        }

        const existingItems = [...(siteRaw.gallery?.items ?? [])];
        const gallery =
          normalizeGallerySection({
            ...siteRaw.gallery,
            items: [...existingItems, ...newItems],
          })!;

        nextSite = {
          ...siteRaw,
          gallery,
          sections: {
            ...siteRaw.sections,
            gallery: gallery.items.length > 0 ? true : siteRaw.sections?.gallery,
          },
        };
        itemsAdded = newItems.length;
        partialChanged += 1;
        catStats.partialPlanned += 1;
      }

      galleryItemsToAdd += itemsAdded;
      catStats.galleryItemsToAdd += itemsAdded;

      const validated = validateSiteConfig(nextSite);
      const after = countUsableImages(validated);

      if (after.usable < MIN_DEMO_SITE_IMAGES) {
        stillLt6 += 1;
        clientsFailed += 1;
        console.error(
          `[fail] ${slug}: usable ${after.usable} after plan (expected >= ${MIN_DEMO_SITE_IMAGES})`,
        );
        continue;
      }

      if (!dryRun) {
        writeFileSync(
          sitePath,
          `${JSON.stringify(validated, null, 2)}\n`,
          "utf8",
        );
      }

      clientsChanged += 1;
      ge6After += 1;
      if (after.hero) withHeroAfter += 1;
      if (after.galleryValid > 0) withGalleryAfter += 1;

      if (verbose) {
        console.log(
          `[${dryRun ? "plan" : "write"}] ${slug} (${categoryId}): +${itemsAdded} gallery → ${after.usable} usable`,
        );
      }
    } catch (error) {
      clientsFailed += 1;
      stillLt6 += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[fail] ${slug}: ${message}`);
    }
  }

  console.log(`\n=== backfill-demo-gallery${dryRun ? " (dry-run)" : ""} ===`);
  console.log(`Total clients: ${processed}`);
  console.log(`Already >=${MIN_DEMO_SITE_IMAGES}: ${alreadyGe6}`);
  console.log(`Need backfill: ${needBackfill}`);
  console.log(`Partial-image demos changed by plan: ${partialChanged}`);
  console.log(`Empty-image demos changed by plan: ${emptyChanged}`);
  console.log(`Gallery items to add: ${galleryItemsToAdd}`);
  console.log(`Category resolution failures: ${categoryFailures}`);
  console.log(`Pool capacity warnings: ${poolWarnings}`);
  console.log(`Invalid image references: ${invalidImageRefs}`);
  console.log(`Clients changed: ${clientsChanged}`);
  console.log(`Clients >=${MIN_DEMO_SITE_IMAGES} after: ${ge6After}`);
  console.log(`Clients still <${MIN_DEMO_SITE_IMAGES}: ${stillLt6}`);
  console.log(`Clients with hero: ${withHeroAfter}`);
  console.log(`Clients with gallery items: ${withGalleryAfter}`);
  console.log(`Clients skipped: ${clientsSkipped}`);
  console.log(`Clients failed: ${clientsFailed}`);

  console.log(`\n--- by category ---`);
  const sortedCats = [...byCategory.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  for (const [id, stats] of sortedCats) {
    console.log(
      `${id}: total=${stats.total} ok=${stats.alreadyComplete} partial=${stats.partialPlanned} empty=${stats.emptyPlanned} +gallery=${stats.galleryItemsToAdd} catFail=${stats.categoryFailures} poolWarn=${stats.poolWarnings}`,
    );
  }

  if (clientsFailed > 0) {
    process.exitCode = 1;
  } else if (stillLt6 > categoryFailures) {
    // Unexpected shortfalls beyond documented unresolved categories.
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
