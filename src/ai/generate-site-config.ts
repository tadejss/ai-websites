import type { SiteConfig } from "@/content/types/site";
import { getSiteConfigProvider } from "./providers";
import type { BusinessInput } from "./types";

export type { BusinessInput } from "./types";

export async function generateSiteConfig(
  input: BusinessInput,
): Promise<SiteConfig> {
  const provider = getSiteConfigProvider();
  return provider.generateSiteConfig(input);
}
