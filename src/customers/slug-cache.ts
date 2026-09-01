import { unstable_cache } from "next/cache";
import { getCustomerSlugSet } from "./store";

export const CUSTOMER_SLUGS_CACHE_TAG = "customer-slugs";

/**
 * Cached set of slugs with a persistent customer record.
 * Revalidate via revalidateTag(CUSTOMER_SLUGS_CACHE_TAG) after purchase.
 */
export const getCachedCustomerSlugSet = unstable_cache(
  async () => getCustomerSlugSet(),
  ["customer-slugs"],
  { revalidate: 60, tags: [CUSTOMER_SLUGS_CACHE_TAG] },
);
