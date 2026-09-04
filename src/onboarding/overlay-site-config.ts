import type { BusinessInput } from "@/ai/types";
import type { SiteConfig } from "@/content/types/site";
import { mergeSiteConfigWithOnboarding } from "./apply-customer-site";
import {
  canOverlayOnboardingOnPublicSite,
  type OnboardingRecord,
} from "./types";

/**
 * Apply approved onboarding onto a git SiteConfig.
 * Does not invent a new merge algorithm — only `mergeSiteConfigWithOnboarding`.
 * Invalid payload falls back to `base` so the public page never 500s.
 */
export function overlaySiteConfigFromOnboarding(
  base: SiteConfig,
  onboarding: Pick<OnboardingRecord, "status" | "processedPayload"> | null,
): SiteConfig {
  if (!onboarding?.processedPayload) {
    return base;
  }
  if (!canOverlayOnboardingOnPublicSite(onboarding.status)) {
    return base;
  }

  try {
    return mergeSiteConfigWithOnboarding(
      base,
      onboarding.processedPayload.businessInput as BusinessInput,
      onboarding.processedPayload.siteHints,
    );
  } catch (error) {
    console.error(
      "[onboarding] public overlay failed; serving git site.json",
      error instanceof Error ? error.message : error,
    );
    return base;
  }
}
