import type { SiteConfig } from "@/content/types/site";
import type { BusinessInput } from "../types";

export type SiteConfigProvider = {
  name: string;
  generateSiteConfig(
    input: BusinessInput,
    correction?: string,
  ): Promise<SiteConfig>;
};
