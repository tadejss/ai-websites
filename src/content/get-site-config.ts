import type { SiteConfig } from "./types/site";
import { siteSlugs } from "./sites";
import { validateSiteConfig } from "./validate-site-config";

const DEFAULT_SLUG = "default";

function isDirectSiteJson(key: string): boolean {
  return /^\.\/[^/]+\.json$/.test(key);
}

function isClientSiteKey(key: string): boolean {
  return /^\.\/[^/]+\/site\.json$/.test(key);
}

function toSlug(key: string): string {
  return key.replace(/^\.\//, "").replace(/\.json$/, "");
}

function clientSlugFromKey(key: string): string {
  const match = key.match(/^\.\/([^/]+)\/site\.json$/);
  return match?.[1] ?? "";
}

type SiteContext = {
  keys(): string[];
  (id: string): unknown;
};

const clientContext = (
  require as NodeRequire & {
    context(
      directory: string,
      useSubdirectories: boolean,
      regExp: RegExp,
    ): SiteContext;
  }
).context("./clients", true, /\/site\.json$/);

const legacySiteContext = (
  require as NodeRequire & {
    context(
      directory: string,
      useSubdirectories: boolean,
      regExp: RegExp,
    ): SiteContext;
  }
).context("./sites", false, /\.json$/);

const siteConfigs: Record<string, SiteConfig> = {};

legacySiteContext.keys().forEach((key) => {
  if (!isDirectSiteJson(key)) {
    return;
  }

  const slug = toSlug(key);
  siteConfigs[slug] = validateSiteConfig(legacySiteContext(key));
});

clientContext.keys().forEach((key) => {
  if (!isClientSiteKey(key)) {
    return;
  }

  const slug = clientSlugFromKey(key);
  siteConfigs[slug] = validateSiteConfig(clientContext(key));
});

function resolveSlug(slug?: string): string {
  if (slug !== undefined) {
    return slug;
  }

  return process.env.SITE_SLUG ?? DEFAULT_SLUG;
}

function expectedSiteConfigPaths(slug: string): string {
  return `src/content/clients/${slug}/site.json or src/content/sites/${slug}.json`;
}

export function getSiteConfig(slug?: string): SiteConfig {
  const resolvedSlug = resolveSlug(slug);

  if (!siteSlugs.includes(resolvedSlug)) {
    throw new Error(
      `Site config not found for slug "${resolvedSlug}". Expected file: ${expectedSiteConfigPaths(resolvedSlug)}`,
    );
  }

  const config = siteConfigs[resolvedSlug];

  if (!config) {
    throw new Error(
      `Site config not found for slug "${resolvedSlug}". Expected file: ${expectedSiteConfigPaths(resolvedSlug)}`,
    );
  }

  return config;
}
