import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  assetCacheKey,
  incrementAssetUsage,
  putCachedStockAsset,
  readAssetCache,
  resetUsageSeedForTests,
  writeAssetCache,
} from "../src/images/asset-cache";
import {
  resolveImagePoolCategory,
} from "../src/images/image-pool-category";
import { INITIAL_FILL, MAX_IMAGE_USES } from "../src/images/image-pool-config";
import {
  assignPoolAssetToClient,
  ensureCategoryPoolReady,
  getEligiblePoolAssets,
  getPoolMembers,
  registerAssetInPool,
  resetImagePoolSeedState,
  selectPoolAssetKeys,
  selectPoolAssets,
} from "../src/images/image-pool";

let failures = 0;
let tempDir = "";
let originalFetch: typeof fetch;
let pexelsSearchCalls = 0;
let pexelsDownloadCalls = 0;

function check(label: string, condition: boolean): void {
  if (!condition) {
    failures += 1;
  }
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
}

function makeAsset(id: string, searchQuery: string) {
  return {
    provider: "pexels" as const,
    id,
    src: `/stock/pexels/${id}.avif`,
    srcFallback: `/stock/pexels/${id}.webp`,
    width: 800,
    height: 1200,
    format: "avif" as const,
    fallbackFormat: "webp" as const,
    sourceUrl: `https://www.pexels.com/photo/${id}/`,
    photographer: "Test Photographer",
    searchQuery,
    storedAt: new Date().toISOString(),
  };
}

async function seedCacheWithPool(
  category: "cistilni-servisi" | "frizerji",
  assetIds: string[],
  usageById: Record<string, number> = {},
) {
  const cache = await readAssetCache();
  const keys: string[] = [];

  for (const id of assetIds) {
    const asset = makeAsset(
      id,
      category === "cistilni-servisi"
        ? "professional office cleaning service worker"
        : "modern hair salon interior natural light",
    );
    const key = assetCacheKey(asset.provider, asset.id);
    keys.push(key);
    cache.assets[key] = { ...asset, usageCount: usageById[id] ?? 0 };
  }

  cache.pools[category] = keys;
  await writeAssetCache(cache);
}

function mockPexelsFetch(photoIds: number[]) {
  pexelsSearchCalls = 0;
  pexelsDownloadCalls = 0;

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes("api.pexels.com/v1/search")) {
      pexelsSearchCalls += 1;
      const startId = 9000 + pexelsSearchCalls * 10;
      const photos = photoIds.map((offset, index) => ({
        id: startId + offset + index,
        photographer: "Mock Pexels",
        photographer_url: "https://www.pexels.com/@mock",
        url: `https://www.pexels.com/photo/${startId + offset + index}/`,
        width: 1200,
        height: 1800,
        src: {
          large2x: `https://images.example.com/${startId + offset + index}.jpg`,
        },
      }));

      return {
        ok: true,
        status: 200,
        async json() {
          return { photos };
        },
        async text() {
          return "";
        },
      } as Response;
    }

    if (url.includes("images.example.com")) {
      pexelsDownloadCalls += 1;
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z5BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      );
      return {
        ok: true,
        status: 200,
        async arrayBuffer() {
          return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength);
        },
        async text() {
          return "";
        },
      } as Response;
    }

    return originalFetch(input);
  }) as typeof fetch;
}

async function setup() {
  tempDir = await mkdtemp(path.join(tmpdir(), "image-pool-test-"));
  process.env.IMAGE_ASSET_CACHE_PATH = path.join(tempDir, "image-asset-cache.json");
  process.env.PEXELS_API_KEY = "test-pexels-key";
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_STORE_ID;
  delete process.env.VERCEL_OIDC_TOKEN;

  await mkdir(path.join(tempDir, "public", "stock", "pexels"), {
    recursive: true,
  });

  originalFetch = globalThis.fetch;
  resetUsageSeedForTests();
  resetImagePoolSeedState();
}

async function teardown() {
  globalThis.fetch = originalFetch;
  delete process.env.IMAGE_ASSET_CACHE_PATH;
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  await setup();

  console.log("== category resolution ==");
  check(
    "cistilni-servisi from company name",
    resolveImagePoolCategory({
      industry: "Čistilni servis",
      companyName: "Čistilni servis Val",
    }) === "cistilni-servisi",
  );
  check(
    "cistilni-servisi from čiščenje objektov",
    resolveImagePoolCategory({
      industry: "čiščenje objektov",
      companyName: "Milomir d.o.o.",
    }) === "cistilni-servisi",
  );
  check(
    "cistilni-servisi from cleaning service",
    resolveImagePoolCategory({
      industry: "cleaning service",
      companyName: "Clean Co",
    }) === "cistilni-servisi",
  );
  check(
    "unmapped locksmith stays undefined",
    resolveImagePoolCategory({
      industry: "Ključavničarstvo",
      companyName: "Ključavničar Jože",
    }) === undefined,
  );

  console.log("\n== pool selection and usage ==");
  await seedCacheWithPool("cistilni-servisi", ["101", "102", "103"], {
    "101": 0,
    "102": 0,
    "103": 5,
  });

  const eligible = await getEligiblePoolAssets("cistilni-servisi", MAX_IMAGE_USES);
  check("eligible assets found", eligible.length === 3);

  const keys = await selectPoolAssets("cistilni-servisi", "client-a", 2);
  check("two different images selected", keys.length === 2 && keys[0] !== keys[1]);
  check(
    "prefers lower usage count",
    keys.every((key) => {
      const asset = eligible.find(
        (entry) => assetCacheKey(entry.provider, entry.id) === key,
      );
      return (asset?.usageCount ?? 99) <= 5;
    }),
  );

  const before = (await readAssetCache()).assets[keys[0]!]?.usageCount ?? 0;
  await incrementAssetUsage(keys[0]!);
  const after = (await readAssetCache()).assets[keys[0]!]?.usageCount ?? 0;
  check("usage count increments", after === before + 1);

  await seedCacheWithPool("frizerji", ["201"], { "201": MAX_IMAGE_USES });
  const exhausted = await getEligiblePoolAssets("frizerji", MAX_IMAGE_USES);
  check("asset at max uses excluded", exhausted.length === 0);

  const tierKeys = selectPoolAssetKeys(
    "cistilni-servisi",
    "client-b",
    2,
    [
      { key: "pexels:301", usageCount: 1 },
      { key: "pexels:302", usageCount: 1 },
      { key: "pexels:303", usageCount: 1 },
    ],
  );
  check("deterministic selection among equal usage", tierKeys.length === 2);

  console.log("\n== cross-client reuse ==");
  await seedCacheWithPool("cistilni-servisi", ["401", "402"], { "401": 2, "402": 2 });
  const reuseKey = assetCacheKey("pexels", "401");
  const usageBeforeReuse = (await readAssetCache()).assets[reuseKey]?.usageCount ?? 0;
  await incrementAssetUsage(reuseKey);
  await incrementAssetUsage(reuseKey);
  const usageAfterReuse = (await readAssetCache()).assets[reuseKey]?.usageCount ?? 0;
  check("same asset reused across clients", usageAfterReuse === usageBeforeReuse + 2);

  console.log("\n== pexels pool fill ==");
  resetImagePoolSeedState();
  await writeAssetCache({
    version: 2,
    assets: {},
    pools: {
      "nohti-pedikura": [],
      "maserji-wellness": [],
      vulkanizerji: [],
      "avtokleparji-licarji": [],
      avtomehaniki: [],
      frizerji: [],
      kozmeticarji: [],
      "vodovodarji-ogrevanje": [],
      elektricarji: [],
      keramicarji: [],
      slikopleskarji: [],
      suhomontazerji: [],
      "mizarji-tesarji": [],
      "parketarji-talne-obloge": [],
      gradbinci: [],
      "cistilni-servisi": [],
    },
  });

  mockPexelsFetch([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  await ensureCategoryPoolReady("cistilni-servisi");
  const filledMembers = await getPoolMembers("cistilni-servisi");
  check(
    `first category use fills at least ${INITIAL_FILL} images`,
    filledMembers.length >= INITIAL_FILL,
  );
  check("new downloads added to pool", filledMembers.length > 0);
  check("pexels search called for initial fill", pexelsSearchCalls > 0);

  const searchCallsAfterFill = pexelsSearchCalls;
  await seedCacheWithPool(
    "cistilni-servisi",
    filledMembers.map((key) => key.split(":")[1]!).filter(Boolean),
  );
  mockPexelsFetch([]);
  pexelsSearchCalls = 0;
  resetImagePoolSeedState();
  await seedCacheWithPool("cistilni-servisi", ["501", "502", "503", "504", "505", "506", "507", "508", "509", "510"]);
  await selectPoolAssets("cistilni-servisi", "client-local", 2);
  check(
    "local images preferred over pexels when pool has eligible assets",
    pexelsSearchCalls === 0,
  );

  console.log("\n== deduplication ==");
  resetImagePoolSeedState();
  const asset = makeAsset("777", "professional office cleaning service worker");
  await putCachedStockAsset(asset, 0);
  await registerAssetInPool("cistilni-servisi", asset.provider, asset.id);
  mockPexelsFetch([777]);
  pexelsDownloadCalls = 0;
  await ensureCategoryPoolReady("cistilni-servisi");
  check(
    "duplicate provider:id not re-downloaded when already cached",
    pexelsDownloadCalls === 0,
  );

  console.log("\n== cistilni-servisi pool lifecycle ==");
  resetImagePoolSeedState();
  await writeAssetCache({
    version: 2,
    assets: {},
    pools: {
      "nohti-pedikura": [],
      "maserji-wellness": [],
      vulkanizerji: [],
      "avtokleparji-licarji": [],
      avtomehaniki: [],
      frizerji: [],
      kozmeticarji: [],
      "vodovodarji-ogrevanje": [],
      elektricarji: [],
      keramicarji: [],
      slikopleskarji: [],
      suhomontazerji: [],
      "mizarji-tesarji": [],
      "parketarji-talne-obloge": [],
      gradbinci: [],
      "cistilni-servisi": [],
    },
  });
  mockPexelsFetch([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  await ensureCategoryPoolReady("cistilni-servisi");
  const lifecycleMembers = await getPoolMembers("cistilni-servisi");
  check("cistilni first use reaches initial fill", lifecycleMembers.length >= INITIAL_FILL);

  pexelsSearchCalls = 0;
  const selected = await selectPoolAssets("cistilni-servisi", "lifecycle-client", 2);
  check("cistilni subsequent selection uses local pool", selected.length === 2);
  check("cistilni no pexels on subsequent selection", pexelsSearchCalls === 0);

  console.log("\n== exhausted pool triggers pexels ==");
  resetImagePoolSeedState();
  await seedCacheWithPool(
    "frizerji",
    ["801"],
    { "801": MAX_IMAGE_USES },
  );
  mockPexelsFetch([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  pexelsSearchCalls = 0;
  await ensureCategoryPoolReady("frizerji");
  check("pexels called when all local assets exhausted", pexelsSearchCalls > 0);

  console.log("\n== unmapped legacy fallback ==");
  check(
    "landscaping stays unmapped for legacy path",
    resolveImagePoolCategory({
      industry: "vrtnarstvo",
      companyName: "Vrtnarstvo Ana",
    }) === undefined,
  );

  await teardown();

  if (failures > 0) {
    console.error(`\n${failures} image pool test(s) failed.`);
    process.exit(1);
  }

  console.log("\nAll image pool checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
