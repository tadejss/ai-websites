import type { SiteConfig } from "@/content/types/site";

export const APPEARANCE_IDS = [
  "default",
  "beauty",
  "zbrendiraj",
  "elektro",
  "construction",
  "cleaning",
  "health",
  "auto",
] as const;

export type AppearanceId = (typeof APPEARANCE_IDS)[number];

export const TRADE_APPEARANCE_IDS = [
  "elektro",
  "construction",
  "cleaning",
  "health",
  "auto",
] as const;

export type TradeAppearanceId = (typeof TRADE_APPEARANCE_IDS)[number];

export function isTradeAppearance(
  appearance: AppearanceId,
): appearance is TradeAppearanceId {
  return (TRADE_APPEARANCE_IDS as readonly string[]).includes(appearance);
}

export type AppearancePageProps = {
  siteConfig: SiteConfig;
  siteSlug: string;
};

export type AppearanceDefinition = {
  id: AppearanceId;
  Page: React.ComponentType<AppearancePageProps>;
};
