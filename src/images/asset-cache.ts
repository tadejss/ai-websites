import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
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

type AssetCacheFile = {
  version: 1;
  assets: Record<string, CachedStockAsset>;
};

const CACHE_PATH = path.join(process.cwd(), "data", "image-asset-cache.json");

function assetKey(provider: string, id: string): string {
  return `${provider}:${id}`;
}

async function readCache(): Promise<AssetCacheFile> {
  try {
    const raw = await readFile(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw) as AssetCacheFile;
    if (parsed?.version === 1 && parsed.assets) {
      return parsed;
    }
  } catch {
    // Missing or invalid — start fresh.
  }
  return { version: 1, assets: {} };
}

async function writeCache(cache: AssetCacheFile): Promise<void> {
  await mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}

export async function getCachedStockAsset(
  provider: string,
  id: string,
): Promise<CachedStockAsset | undefined> {
  const cache = await readCache();
  return cache.assets[assetKey(provider, id)];
}

export async function putCachedStockAsset(
  asset: CachedStockAsset,
): Promise<void> {
  const cache = await readCache();
  cache.assets[assetKey(asset.provider, asset.id)] = asset;
  await writeCache(cache);
}
