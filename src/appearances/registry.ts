import { BeautySitePage } from "./beauty/BeautySitePage";
import { DefaultSitePage } from "./default/DefaultSitePage";
import { TradeSitePage } from "./trade/TradeSitePage";
import { ZbrendirajSitePage } from "./zbrendiraj/ZbrendirajSitePage";
import type { AppearanceDefinition } from "./types";

export const appearanceRegistry = {
  default: {
    id: "default",
    Page: DefaultSitePage,
  },
  beauty: {
    id: "beauty",
    Page: BeautySitePage,
  },
  zbrendiraj: {
    id: "zbrendiraj",
    Page: ZbrendirajSitePage,
  },
  elektro: {
    id: "elektro",
    Page: TradeSitePage,
  },
  construction: {
    id: "construction",
    Page: TradeSitePage,
  },
  cleaning: {
    id: "cleaning",
    Page: TradeSitePage,
  },
  health: {
    id: "health",
    Page: TradeSitePage,
  },
  auto: {
    id: "auto",
    Page: TradeSitePage,
  },
} satisfies Record<import("./types").AppearanceId, AppearanceDefinition>;
