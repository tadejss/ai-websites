import { appearanceRegistry } from "@/appearances/registry";
import { resolveAppearance } from "@/appearances/resolve-appearance";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function SitePage({ siteConfig }: Props) {
  const appearance = resolveAppearance(siteConfig.appearance);
  const { Page } = appearanceRegistry[appearance];

  return (
    <div
      data-appearance={appearance}
      className="min-h-full bg-background text-foreground"
    >
      <Page siteConfig={siteConfig} />
    </div>
  );
}
