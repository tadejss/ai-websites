import type { SiteConfig } from "@/content/types/site";
import { getSiteConfig } from "@/content/get-site-config";
import { siteSlugs } from "@/content/sites";

const DEFAULT_SLUG = "default";

export type LegalPageKind = "privacy" | "cookies";

export type LegalPageContext = {
  slug: string;
  siteConfig: SiteConfig;
};

export function resolveSiteSlug(slug?: string): string {
  if (slug !== undefined) {
    return slug;
  }

  return process.env.SITE_SLUG ?? DEFAULT_SLUG;
}

export function getLegalPageContext(
  kind: LegalPageKind,
  slug?: string,
): LegalPageContext {
  const resolvedSlug = resolveSiteSlug(slug);
  const siteConfig = getSiteConfig(resolvedSlug);

  if (!siteConfig.privacy.enabled) {
    throw new Error(`Privacy is disabled for slug "${resolvedSlug}"`);
  }

  return {
    slug: resolvedSlug,
    siteConfig,
  };
}

export function legalPageTitle(kind: LegalPageKind, config: SiteConfig): string {
  if (kind === "privacy") {
    return `Politika zasebnosti – ${config.business.name}`;
  }

  return `Politika piškotkov – ${config.business.name}`;
}

export function legalPageDescription(
  kind: LegalPageKind,
  config: SiteConfig,
): string {
  if (kind === "privacy") {
    return `Informacije o obdelavi osebnih podatkov na spletni strani ${config.business.name}.`;
  }

  return `Informacije o uporabi piškotkov in podobnih tehnologij na spletni strani ${config.business.name}.`;
}

export function legalStaticParams() {
  return siteSlugs.flatMap((slug) => [
    { slug },
  ]);
}
