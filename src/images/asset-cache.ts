import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ImagePoolCategoryId } from "./image-pool-category";
import { IMAGE_POOL_CATEGORY_IDS } from "./image-pool-category";
import type { StockImageProvider } from "./providers/types";

export type CachedStockAsset = {
  provider: StockImageProvider;
  id: string;
  src: string;
  srcFallback: string;
  width: number;
  height: number;
  format: "avif";
  fallbackFormat: "webp";
  sourceUrl: string;
  photographer: string;
  photographerUrl?: string;
  searchQuery: string;
  storedAt: string;
};

export type CachedStockAssetRecord = CachedStockAsset & {
  usageCount: number;
};

type AssetCacheFileV1 = {
  version: 1;
  assets: Record<string, CachedStockAsset>;
};

export type AssetCacheFileV2 = {
  version: 2;
  assets: Record<string, CachedStockAssetRecord>;
  pools: Record<ImagePoolCategoryId, string[]>;
};

function defaultPools(): Record<ImagePoolCategoryId, string[]> {
  const pools = {} as Record<ImagePoolCategoryId, string[]>;
  for (const id of IMAGE_POOL_CATEGORY_IDS) {
    pools[id] = [];
  }
  return pools;
}

function cachePath(): string {
  return (
    process.env.IMAGE_ASSET_CACHE_PATH?.trim() ||
    path.join(process.cwd(), "data", "image-asset-cache.json")
  );
}

export function assetCacheKey(provider: string, id: string): string {
  return `${provider}:${id}`;
}

function migrateV1ToV2(file: AssetCacheFileV1): AssetCacheFileV2 {
  const assets: Record<string, CachedStockAssetRecord> = {};
  for (const [key, asset] of Object.entries(file.assets)) {
    assets[key] = { ...asset, usageCount: 0 };
  }
  return { version: 2, assets, pools: defaultPools() };
}

function normalizeV2(parsed: Partial<AssetCacheFileV2>): AssetCacheFileV2 {
  const pools = defaultPools();
  if (parsed.pools) {
    for (const categoryId of IMAGE_POOL_CATEGORY_IDS) {
      pools[categoryId] = [...(parsed.pools[categoryId] ?? [])];
    }
  }

  const assets: Record<string, CachedStockAssetRecord> = {};
  for (const [key, asset] of Object.entries(parsed.assets ?? {})) {
    assets[key] = {
      ...asset,
      usageCount: asset.usageCount ?? 0,
    };
  }

  return { version: 2, assets, pools };
}

let usageSeedPromise: Promise<void> | undefined;

export async function readAssetCache(): Promise<AssetCacheFileV2> {
  const CACHE_PATH = cachePath();
  try {
    const raw = await readFile(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw) as AssetCacheFileV1 | AssetCacheFileV2;
    if (parsed?.version === 2 && parsed.assets) {
      return normalizeV2(parsed);
    }
    if (parsed?.version === 1 && parsed.assets) {
      return migrateV1ToV2(parsed);
    }
  } catch {
    // Missing or invalid — start fresh.
  }
  return { version: 2, assets: {}, pools: defaultPools() };
}

export async function writeAssetCache(cache: AssetCacheFileV2): Promise<void> {
  const CACHE_PATH = cachePath();
  await mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}

async function updateCache(
  mutator: (cache: AssetCacheFileV2) => void,
): Promise<AssetCacheFileV2> {
  const cache = await readAssetCache();
  mutator(cache);
  await writeAssetCache(cache);
  return cache;
}

export async function getCachedStockAsset(
  provider: string,
  id: string,
): Promise<CachedStockAssetRecord | undefined> {
  const cache = await readAssetCache();
  return cache.assets[assetCacheKey(provider, id)];
}

export async function putCachedStockAsset(
  asset: CachedStockAsset,
  usageCount = 0,
): Promise<CachedStockAssetRecord> {
  const key = assetCacheKey(asset.provider, asset.id);
  const record: CachedStockAssetRecord = { ...asset, usageCount };

  await updateCache((cache) => {
    const existing = cache.assets[key];
    cache.assets[key] = {
      ...record,
      usageCount: existing?.usageCount ?? usageCount,
    };
  });

  return record;
}

export async function incrementAssetUsage(key: string): Promise<number> {
  let nextCount = 0;
  await updateCache((cache) => {
    const asset = cache.assets[key];
    if (!asset) {
      return;
    }
    asset.usageCount += 1;
    nextCount = asset.usageCount;
  });
  return nextCount;
}

export async function getPoolMembers(
  category: ImagePoolCategoryId,
): Promise<string[]> {
  const cache = await readAssetCache();
  return [...(cache.pools[category] ?? [])];
}

export async function addPoolMember(
  category: ImagePoolCategoryId,
  key: string,
): Promise<void> {
  await updateCache((cache) => {
    const members = cache.pools[category] ?? [];
    if (!members.includes(key)) {
      cache.pools[category] = [...members, key];
    }
  });
}

export async function getEligiblePoolAssets(
  category: ImagePoolCategoryId,
  maxUses: number,
): Promise<CachedStockAssetRecord[]> {
  const cache = await readAssetCache();
  const members = cache.pools[category] ?? [];
  const eligible: CachedStockAssetRecord[] = [];

  for (const key of members) {
    const asset = cache.assets[key];
    if (asset && asset.usageCount < maxUses) {
      eligible.push(asset);
    }
  }

  return eligible;
}

export async function countPoolMembers(category: ImagePoolCategoryId): Promise<number> {
  const cache = await readAssetCache();
  return (cache.pools[category] ?? []).length;
}

export async function listCachedAssetKeys(): Promise<string[]> {
  const cache = await readAssetCache();
  return Object.keys(cache.assets);
}

/** One-time scan of client site.json files to seed usage counts (read-only). */
export async function seedUsageCountsFromClients(
  clientsDir = path.join(process.cwd(), "src", "content", "clients"),
): Promise<void> {
  const usageByKey = new Map<string, number>();

  let entries: string[] = [];
  try {
    entries = await readdir(clientsDir);
  } catch {
    return;
  }

  for (const slug of entries) {
    const sitePath = path.join(clientsDir, slug, "site.json");
    try {
      const raw = await readFile(sitePath, "utf8");
      const site = JSON.parse(raw) as {
        images?: {
          hero?: { provider?: string; sourceId?: string };
          services?: { provider?: string; sourceId?: string };
        };
      };

      for (const slot of ["hero", "services"] as const) {
        const image = site.images?.[slot];
        if (image?.provider && image.sourceId) {
          const key = assetCacheKey(image.provider, image.sourceId);
          usageByKey.set(key, (usageByKey.get(key) ?? 0) + 1);
        }
      }
    } catch {
      // Skip missing or invalid client files.
    }
  }

  if (usageByKey.size === 0) {
    return;
  }

  await updateCache((cache) => {
    for (const [key, count] of usageByKey) {
      const asset = cache.assets[key];
      if (asset) {
        asset.usageCount = Math.max(asset.usageCount ?? 0, count);
      }
    }
  });
}

export async function ensureUsageCountsSeeded(): Promise<void> {
  if (!usageSeedPromise) {
    usageSeedPromise = seedUsageCountsFromClients();
  }
  await usageSeedPromise;
}

/** Test helper — allows re-seeding usage counts. */
export function resetUsageSeedForTests(): void {
  usageSeedPromise = undefined;
}
