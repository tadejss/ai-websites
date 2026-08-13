import type { SitePrivacyConfig } from "@/content/types/site";

export function requiresCookieConsent(privacy: SitePrivacyConfig): boolean {
  return (
    privacy.analytics.enabled ||
    privacy.marketing.enabled ||
    privacy.cookies.nonEssential ||
    privacy.thirdPartyEmbeds.googleMaps ||
    privacy.thirdPartyEmbeds.youtube
  );
}
