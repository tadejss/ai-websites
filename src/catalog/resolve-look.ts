import type { SiteConfig } from "@/content/types/site";
import type { SiteLookDefinition } from "@/catalog/types";
import { getLook } from "@/catalog/looks";

export function resolveLookForSite(
  config: SiteConfig,
): SiteLookDefinition | undefined {
  if (!config.lookId) {
    return undefined;
  }

  return getLook(config.lookId);
}

export function resolveLookDesignTokens(
  config: SiteConfig,
): SiteLookDefinition["designTokens"] | undefined {
  return resolveLookForSite(config)?.designTokens;
}
