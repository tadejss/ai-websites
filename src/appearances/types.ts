import type { SiteConfig } from "@/content/types/site";

export const APPEARANCE_IDS = ["default", "beauty", "zbrendiraj"] as const;

export type AppearanceId = (typeof APPEARANCE_IDS)[number];

export type AppearancePageProps = {
  siteConfig: SiteConfig;
  siteSlug: string;
};

export type AppearanceDefinition = {
  id: AppearanceId;
  Page: React.ComponentType<AppearancePageProps>;
};
