import {
  addPoolMember,
  assetCacheKey,
  ensureUsageCountsSeeded,
  getCachedStockAsset,
  getEligiblePoolAssets,
  getPoolMembers,
  incrementAssetUsage,
  listCachedAssetKeys,
  readAssetCache,
} from "./asset-cache";
import { assignCachedAssetToClient, persistStockCandidate } from "./download-stock-photo";
import {
  categorySearchHint,
  type ImagePoolCategoryId,
} from "./image-pool-category";
import { INITIAL_FILL, MAX_IMAGE_USES, POOL_TARGET } from "./image-pool-config";
import {
  getAllPoolSearchQueries,
  getPoolSearchQueries,
} from "./image-pool-queries";
import {
  downloadPexelsCandidate,
  isPexelsConfigured,
  pexelsPhotoToCandidate,
  searchPexelsPhotos,
} from "./providers/pexels";
import type { StockPhotoCandidate } from "./providers/types";
import type { ImageSlot } from "./types";

function hashString(value: string): number {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return Math.abs(hash);
}

const seededCategories = new Set<ImagePoolCategoryId>();

/** Test helper — clears in-memory seed tracking. */
export function resetImagePoolSeedState(): void {
  seededCategories.clear();
}

export async function registerAssetInPool(
  category: ImagePoolCategoryId,
  provider: string,
  id: string,
): Promise<string> {
  const key = assetCacheKey(provider, id);
  await addPoolMember(category, key);
  return key;
}

export async function seedPoolFromExistingCache(
  category: ImagePoolCategoryId,
): Promise<number> {
  if (seededCategories.has(category)) {
    return 0;
  }
  seededCategories.add(category);

  const hint = categorySearchHint(category);
  const cache = await readAssetCache();
  const existingMembers = new Set(cache.pools[category] ?? []);
  let added = 0;

  for (const [key, asset] of Object.entries(cache.assets)) {
    if (existingMembers.has(key)) {
      continue;
    }
    if (hint.test(asset.searchQuery)) {
      await addPoolMember(category, key);
      existingMembers.add(key);
      added += 1;
    }
  }

  return added;
}

async function ingestCandidateToPool(
  category: ImagePoolCategoryId,
  candidate: StockPhotoCandidate,
  slot: ImageSlot,
  ingestSlug: string,
): Promise<string | undefined> {
  const key = assetCacheKey(candidate.provider, candidate.id);
  const existing = await getCachedStockAsset(candidate.provider, candidate.id);

  if (existing) {
    await registerAssetInPool(category, candidate.provider, candidate.id);
    return key;
  }

  const data = await downloadPexelsCandidate(candidate);
  if (!data) {
    return undefined;
  }

  await persistStockCandidate(data, candidate, slot, ingestSlug);
  await registerAssetInPool(category, candidate.provider, candidate.id);
  return key;
}

async function fetchNewPoolAssets(
  category: ImagePoolCategoryId,
  targetCount: number,
  excludeKeys: Set<string>,
): Promise<number> {
  if (!isPexelsConfigured() || targetCount <= 0) {
    return 0;
  }

  const queries = getAllPoolSearchQueries(category);
  const ingestSlug = `_pool-ingest-${category}`;
  let added = 0;
  const triedKeys = new Set(excludeKeys);

  for (const search of queries) {
    if (added >= targetCount) {
      break;
    }

    const photos = await searchPexelsPhotos(search.query, search.orientation);
    const slot: ImageSlot = search.orientation === "portrait" ? "hero" : "services";

    for (const photo of photos) {
      if (added >= targetCount) {
        break;
      }

      const candidate = pexelsPhotoToCandidate(photo, search.query);
      if (!candidate) {
        continue;
      }

      const key = assetCacheKey(candidate.provider, candidate.id);
      if (triedKeys.has(key)) {
        continue;
      }
      triedKeys.add(key);

      const cached = await getCachedStockAsset(candidate.provider, candidate.id);
      if (cached) {
        await registerAssetInPool(category, candidate.provider, candidate.id);
        added += 1;
        continue;
      }

      const ingested = await ingestCandidateToPool(
        category,
        candidate,
        slot,
        ingestSlug,
      );
      if (ingested) {
        added += 1;
      }
    }
  }

  return added;
}

export async function replenishCategoryPool(
  category: ImagePoolCategoryId,
): Promise<void> {
  const members = await getPoolMembers(category);
  const eligible = await getEligiblePoolAssets(category, MAX_IMAGE_USES);
  const excludeKeys = new Set(members);
  const targetTotal = Math.min(
    POOL_TARGET,
    members.length + Math.max(POOL_TARGET - members.length, INITIAL_FILL),
  );
  const need = Math.max(0, targetTotal - members.length);

  if (eligible.length > 0 && need === 0) {
    return;
  }

  const toFetch = eligible.length === 0 ? Math.max(need, INITIAL_FILL) : need;
  if (toFetch > 0) {
    await fetchNewPoolAssets(category, toFetch, excludeKeys);
  }
}

export async function ensureCategoryPoolReady(
  category: ImagePoolCategoryId,
): Promise<void> {
  await ensureUsageCountsSeeded();
  await seedPoolFromExistingCache(category);

  let eligible = await getEligiblePoolAssets(category, MAX_IMAGE_USES);

  if (eligible.length < INITIAL_FILL) {
    const need = INITIAL_FILL - eligible.length;
    const members = await getPoolMembers(category);
    await fetchNewPoolAssets(category, need, new Set(members));
    eligible = await getEligiblePoolAssets(category, MAX_IMAGE_USES);
  }

  if (eligible.length === 0) {
    await replenishCategoryPool(category);
  }
}

export function selectPoolAssetKeys(
  category: ImagePoolCategoryId,
  slug: string,
  count: number,
  eligible: Array<{ key: string; usageCount: number }>,
  excludeKeys: Set<string> = new Set(),
): string[] {
  const filtered = eligible.filter((entry) => !excludeKeys.has(entry.key));
  if (filtered.length === 0) {
    return [];
  }

  const sorted = [...filtered].sort((a, b) => {
    if (a.usageCount !== b.usageCount) {
      return a.usageCount - b.usageCount;
    }
    return hashString(`${slug}:${a.key}`) - hashString(`${slug}:${b.key}`);
  });

  const minUsage = sorted[0]?.usageCount ?? 0;
  const tier = sorted.filter((entry) => entry.usageCount === minUsage);
  const rotated = [...tier].sort(
    (a, b) =>
      hashString(`${slug}:${a.key}`) - hashString(`${slug}:${b.key}`),
  );

  const selected: string[] = [];
  for (const entry of rotated) {
    if (selected.length >= count) {
      break;
    }
    if (!selected.includes(entry.key)) {
      selected.push(entry.key);
    }
  }

  if (selected.length < count) {
    for (const entry of sorted) {
      if (selected.length >= count) {
        break;
      }
      if (!selected.includes(entry.key)) {
        selected.push(entry.key);
      }
    }
  }

  return selected;
}

export async function selectPoolAssets(
  category: ImagePoolCategoryId,
  slug: string,
  count: number,
  excludeKeys: Set<string> = new Set(),
): Promise<string[]> {
  const eligibleRecords = await getEligiblePoolAssets(category, MAX_IMAGE_USES);
  const eligible = eligibleRecords.map((asset) => ({
    key: assetCacheKey(asset.provider, asset.id),
    usageCount: asset.usageCount,
  }));
  return selectPoolAssetKeys(category, slug, count, eligible, excludeKeys);
}

export async function assignPoolAssetToClient(
  key: string,
  slot: ImageSlot,
  slug: string,
): Promise<
  | {
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
    }
  | undefined
> {
  const cache = await readAssetCache();
  const asset = cache.assets[key];
  if (!asset) {
    return undefined;
  }

  const clientUrls = await assignCachedAssetToClient(slug, slot, asset);
  if (!clientUrls) {
    return undefined;
  }

  await incrementAssetUsage(key);

  return {
    src: clientUrls.src,
    srcFallback: clientUrls.srcFallback,
    width: asset.width,
    height: asset.height,
    provider: asset.provider,
    sourceId: asset.id,
    sourceUrl: asset.sourceUrl,
    photographer: asset.photographer,
    photographerUrl: asset.photographerUrl,
    searchQuery: asset.searchQuery,
  };
}

export async function generateImagesFromPool(
  category: ImagePoolCategoryId,
  slug: string,
): Promise<
  | {
      hero: Awaited<ReturnType<typeof assignPoolAssetToClient>>;
      services: Awaited<ReturnType<typeof assignPoolAssetToClient>>;
    }
  | undefined
> {
  await ensureCategoryPoolReady(category);

  let keys = await selectPoolAssets(category, slug, 2);
  if (keys.length === 0) {
    await replenishCategoryPool(category);
    keys = await selectPoolAssets(category, slug, 2);
  }

  if (keys.length === 0) {
    return undefined;
  }

  const heroKey = keys[0]!;
  const servicesKey = keys[1] ?? keys[0]!;

  const hero = await assignPoolAssetToClient(heroKey, "hero", slug);
  const services = await assignPoolAssetToClient(servicesKey, "services", slug);

  if (!hero || !services) {
    return undefined;
  }

  return { hero, services };
}

/** Exported for tests — list all asset keys currently in cache. */
export { listCachedAssetKeys, getPoolMembers, getEligiblePoolAssets };

/** Exported for tests — expose category queries. */
export { getPoolSearchQueries };
