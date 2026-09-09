import { cache } from "react";
import { getSiteConfig } from "@/content/get-site-config";
import type { SiteConfig } from "@/content/types/site";
import { overlaySiteConfigFromOnboarding } from "./overlay-site-config";
import { getPublicOnboardingBySlug } from "./public-onboarding-cache";

/**
 * Public page source of truth after approve: git demo JSON plus Neon payload.
 * Request-scoped via React.cache so metadata + page share one overlay read;
 * Neon itself is persistently cached in getPublicOnboardingBySlug.
 */
export const resolvePublicSiteConfig = cache(
  async (slug: string): Promise<SiteConfig> => {
    const base = getSiteConfig(slug);

    try {
      const onboarding = await getPublicOnboardingBySlug(slug);
      return overlaySiteConfigFromOnboarding(base, onboarding);
    } catch (error) {
      console.error(
        "[onboarding] public overlay read skipped; serving git site.json",
        error instanceof Error ? error.message : error,
      );
      return base;
    }
  },
);
