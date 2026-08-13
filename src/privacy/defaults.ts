import type { SitePrivacyConfig } from "@/content/types/site";

export function defaultPrivacyConfig(
  lastUpdated = new Date().toISOString().slice(0, 10),
): SitePrivacyConfig {
  return {
    enabled: true,
    lastUpdated,
    contactForm: {
      enabled: true,
      fields: ["name", "phone", "message"],
    },
    analytics: {
      enabled: false,
      provider: null,
    },
    marketing: {
      enabled: false,
    },
    booking: {
      enabled: false,
      type: "external_link",
      providerName: "",
      url: "",
      privacyUrl: "",
    },
    thirdPartyEmbeds: {
      googleMaps: false,
      youtube: false,
    },
    cookies: {
      nonEssential: false,
    },
  };
}
