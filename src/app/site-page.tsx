import { appearanceRegistry } from "@/appearances/registry";
import { resolveAppearance } from "@/appearances/resolve-appearance";
import type { SiteConfig } from "@/content/types/site";
import { resolveThemeCssVars } from "@/theme/resolve-theme";

type Props = {
  siteConfig: SiteConfig;
  siteSlug?: string;
};

export function SitePage({ siteConfig, siteSlug }: Props) {
  const appearance = resolveAppearance(siteConfig.appearance);
  const { Page } = appearanceRegistry[appearance];
  const themeStyle = resolveThemeCssVars(siteConfig.theme, appearance);
  const resolvedSlug = siteSlug ?? process.env.SITE_SLUG ?? "default";

  return (
    <div
      data-appearance={appearance}
      style={themeStyle}
      className="min-h-full bg-background text-foreground"
    >
      <Page siteConfig={siteConfig} siteSlug={resolvedSlug} />
    </div>
  );
}
