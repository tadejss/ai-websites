import defaultSite from "./sites/default.json";
import type { SiteConfig } from "./types/site";

export type {
  Benefit,
  ContactItem,
  IconName,
  NavLink,
  Service,
  SiteConfig,
  Stat,
} from "./types/site";

export const siteConfig: SiteConfig = defaultSite as SiteConfig;
