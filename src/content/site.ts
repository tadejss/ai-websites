import { getSiteConfig } from "./get-site-config";
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

export const siteConfig: SiteConfig = getSiteConfig();
