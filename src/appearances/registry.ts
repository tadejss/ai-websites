import { BeautySitePage } from "./beauty/BeautySitePage";
import { DefaultSitePage } from "./default/DefaultSitePage";
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
} satisfies Record<string, AppearanceDefinition>;
