import { unstable_cache } from "next/cache";
import { getOnboardingBySlug } from "./store";
import type { OnboardingRecord } from "./types";

export const PUBLIC_ONBOARDING_CACHE_TAG = "public-onboarding";

/** Per-slug Data Cache tag; busted from `revalidateCustomerPage`. */
export function publicOnboardingTag(slug: string): string {
  return `${PUBLIC_ONBOARDING_CACHE_TAG}:${slug}`;
}

/**
 * Public overlay read — slug-keyed only (no cookies/headers/auth).
 * Persistently cached ~300s to match public ISR.
 */
export function getPublicOnboardingBySlug(
  slug: string,
): Promise<OnboardingRecord | null> {
  return unstable_cache(
    async () => getOnboardingBySlug(slug),
    ["public-onboarding-by-slug", slug],
    { revalidate: 300, tags: [publicOnboardingTag(slug)] },
  )();
}
