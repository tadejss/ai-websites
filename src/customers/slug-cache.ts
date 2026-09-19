import { unstable_cache } from "next/cache";
import { getCustomerSlugSet } from "./store";
import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";

export const CUSTOMER_SLUGS_CACHE_TAG = "customer-slugs";

/**
 * Cached set of slugs with a persistent customer record.
 * Revalidate via revalidateTag(CUSTOMER_SLUGS_CACHE_TAG) after purchase.
 */
export const getCachedCustomerSlugSet = unstable_cache(
  async (): Promise<string[]> => {
    const slugs = await getCustomerSlugSet();
    return [...slugs];
  },
  ["customer-slugs"],
  { revalidate: 300, tags: [CUSTOMER_SLUGS_CACHE_TAG] },
);

const MEMORY_TTL_MS = 300_000;
let memoryCustomerSlugs: { slugs: Set<string>; expiresAt: number } | null =
  null;

/** Clear isolate memory cache (call after purchase when possible). */
export function invalidateCustomerSlugMemoryCache(): void {
  memoryCustomerSlugs = null;
}

async function loadActiveCustomerSlugSet(): Promise<Set<string>> {
  if (!isDatabaseConfigured()) {
    return new Set();
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT slug FROM customers
    WHERE status = 'customer'
  `) as Array<{ slug: string }>;
  return new Set(rows.map((row) => row.slug));
}

/**
 * Edge/middleware-safe customer membership check with isolate memory TTL.
 * One Neon fetch per isolate per TTL — not per pageview.
 */
export async function isCustomerSlugCached(slug: string): Promise<boolean> {
  const normalized = slug.trim();
  if (!normalized) {
    return false;
  }

  const now = Date.now();
  if (!memoryCustomerSlugs || memoryCustomerSlugs.expiresAt <= now) {
    const active = await loadActiveCustomerSlugSet();
    memoryCustomerSlugs = {
      slugs: active,
      expiresAt: now + MEMORY_TTL_MS,
    };
  }

  return memoryCustomerSlugs.slugs.has(normalized);
}
