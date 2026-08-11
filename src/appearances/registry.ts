import { BeautySitePage } from "./beauty/BeautySitePage";
import { DefaultSitePage } from "./default/DefaultSitePage";
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
} satisfies Record<string, AppearanceDefinition>;
