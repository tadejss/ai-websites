import { normalizeHostHeader } from "./hostname";
import { lookupLiveWebsiteSlug } from "./store";

type CacheEntry = {
  slug: string | null;
  expiresAt: number;
};

/** Best-effort isolate cache only — not a correctness mechanism. */
const CACHE_TTL_MS = 30_000;
const cache = new Map<string, CacheEntry>();

export function invalidateWebsiteDomainLookupCache(): void {
  cache.clear();
}

export async function lookupLiveWebsiteSlugCached(
  hostHeader: string | null,
): Promise<string | null> {
  const hostname = normalizeHostHeader(hostHeader);
  if (!hostname) {
    return null;
  }

  const now = Date.now();
  const hit = cache.get(hostname);
  if (hit && hit.expiresAt > now) {
    return hit.slug;
  }

  const slug = await lookupLiveWebsiteSlug(hostname);
  cache.set(hostname, { slug, expiresAt: now + CACHE_TTL_MS });
  return slug;
}
