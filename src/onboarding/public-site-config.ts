import { getSiteConfig } from "@/content/get-site-config";
import type { SiteConfig } from "@/content/types/site";
import { overlaySiteConfigFromOnboarding } from "./overlay-site-config";
import { getOnboardingBySlug } from "./store";

/**
 * Public page source of truth after approve: git demo JSON plus Neon payload.
 * `revalidatePath` is only an ISR bust — this function is what makes content current.
 */
export async function resolvePublicSiteConfig(slug: string): Promise<SiteConfig> {
  const base = getSiteConfig(slug);

  try {
    const onboarding = await getOnboardingBySlug(slug);
    return overlaySiteConfigFromOnboarding(base, onboarding);
  } catch (error) {
    console.error(
      "[onboarding] public overlay read skipped; serving git site.json",
      error instanceof Error ? error.message : error,
    );
    return base;
  }
}
