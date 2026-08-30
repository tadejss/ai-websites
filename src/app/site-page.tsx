import { appearanceRegistry } from "@/appearances/registry";
import { resolveAppearance } from "@/appearances/resolve-appearance";
import { CustomerPreparingBar } from "@/billing/CustomerPreparingBar";
import { DemoPurchaseBar } from "@/billing/DemoPurchaseBar";
import type { SiteConfig } from "@/content/types/site";
import { readLead } from "@/leads/store";
import { getCustomerChromeState } from "@/onboarding/customer-chrome";
import { resolveThemeCssVars } from "@/theme/resolve-theme";

type Props = {
  siteConfig: SiteConfig;
  siteSlug?: string;
};

export async function SitePage({ siteConfig, siteSlug }: Props) {
  const appearance = resolveAppearance(siteConfig.appearance);
  const { Page } = appearanceRegistry[appearance];
  const themeStyle = resolveThemeCssVars(siteConfig.theme, appearance);
  const resolvedSlug = siteSlug ?? process.env.SITE_SLUG ?? "default";
  const lead = readLead(resolvedSlug);
  const { isCustomer, onboardingUrl, contactName } =
    await getCustomerChromeState(resolvedSlug);
  const showPurchaseBar = appearance !== "zbrendiraj" && !isCustomer;

  return (
    <div
      data-appearance={appearance}
      style={themeStyle}
      className="min-h-full bg-background text-foreground"
    >
      <Page siteConfig={siteConfig} siteSlug={resolvedSlug} />
      {showPurchaseBar ? (
        <DemoPurchaseBar
          slug={resolvedSlug}
          companyName={lead?.companyName ?? siteConfig.business.name}
          brandHighlight={siteConfig.brand.highlight}
        />
      ) : null}
      {isCustomer ? (
        <CustomerPreparingBar
          slug={resolvedSlug}
          onboardingUrl={onboardingUrl}
          companyName={lead?.companyName ?? siteConfig.business.name}
          brandHighlight={siteConfig.brand.highlight}
          contactName={contactName}
        />
      ) : null}
    </div>
  );
}
