import {
  isTradeAppearance,
  type TradeAppearanceId,
} from "@/appearances/types";
import { resolveTradeLayout } from "../assign-layout";
import type { SiteConfig, SiteLayout } from "@/content/types/site";

export function resolveTradeAppearance(
  siteConfig: SiteConfig,
): TradeAppearanceId {
  const appearance = siteConfig.appearance;
  if (appearance && isTradeAppearance(appearance)) {
    return appearance;
  }
  return "elektro";
}

export function resolveTradeLayoutFromConfig(
  siteConfig: SiteConfig,
): SiteLayout {
  return resolveTradeLayout(
    resolveTradeAppearance(siteConfig),
    siteConfig.layout,
  );
}
