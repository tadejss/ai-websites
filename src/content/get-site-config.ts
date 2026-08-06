import type { SiteConfig } from "./types/site";
import { siteSlugs } from "./sites";
import { validateSiteConfig } from "./validate-site-config";

const DEFAULT_SLUG = "default";

type SiteContext = {
  keys(): string[];
  (id: string): unknown;
};

const siteContext = (
  require as NodeRequire & {
    context(
      directory: string,
      useSubdirectories: boolean,
      regExp: RegExp,
    ): SiteContext;
  }
).context("./sites", false, /\.json$/);

const siteConfigs = siteContext.keys().reduce<Record<string, SiteConfig>>(
  (acc, key) => {
    const slug = key.replace(/^\.\//, "").replace(/\.json$/, "");
    acc[slug] = validateSiteConfig(siteContext(key));
    return acc;
  },
  {},
);

function resolveSlug(slug?: string): string {
  if (slug !== undefined) {
    return slug;
  }

  return process.env.SITE_SLUG ?? DEFAULT_SLUG;
}

export function getSiteConfig(slug?: string): SiteConfig {
  const resolvedSlug = resolveSlug(slug);

  if (!siteSlugs.includes(resolvedSlug)) {
    throw new Error(
      `Site config not found for slug "${resolvedSlug}". Expected file: src/content/sites/${resolvedSlug}.json`,
    );
  }

  const config = siteConfigs[resolvedSlug];

  if (!config) {
    throw new Error(
      `Site config not found for slug "${resolvedSlug}". Expected file: src/content/sites/${resolvedSlug}.json`,
    );
  }

  return config;
}
