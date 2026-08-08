import type { SiteConfig } from "@/content/types/site";
import { isRetryable } from "./generation-error";
import { getSiteConfigProvider } from "./providers";
import type { BusinessInput } from "./types";

export type { BusinessInput } from "./types";

export async function generateSiteConfig(
  input: BusinessInput,
): Promise<SiteConfig> {
  const provider = getSiteConfigProvider();

  try {
    return await provider.generateSiteConfig(input);
  } catch (error) {
    if (!isRetryable(error)) {
      throw error;
    }

    return provider.generateSiteConfig(input, (error as Error).message);
  }
}
