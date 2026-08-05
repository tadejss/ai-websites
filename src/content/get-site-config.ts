import type { SiteConfig } from "./types/site";

const DEFAULT_SLUG = "default";

type SiteContext = {
  keys(): string[];
  (id: string): SiteConfig;
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
    acc[slug] = siteContext(key) as SiteConfig;
    return acc;
  },
  {},
);

function resolveSlug(slug?: string): string {
  return slug ?? DEFAULT_SLUG;
}

export function getSiteConfig(slug?: string): SiteConfig {
  const resolvedSlug = resolveSlug(slug);
  const config = siteConfigs[resolvedSlug];

  if (!config) {
    throw new Error(
      `Site config not found for slug "${resolvedSlug}". Expected file: src/content/sites/${resolvedSlug}.json`,
    );
  }

  return config;
}
