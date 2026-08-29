import { appearanceRegistry } from "@/appearances/registry";
import { resolveAppearance } from "@/appearances/resolve-appearance";
import { CustomerPreparingBar } from "@/billing/CustomerPreparingBar";
import { DemoPurchaseBar } from "@/billing/DemoPurchaseBar";
import type { SiteConfig } from "@/content/types/site";
import { isCustomer } from "@/customers/store";
import { readLead } from "@/leads/store";
import {
  ensureOnboardingAccess,
  getOnboardingBySlug,
  getOnboardingUrl,
} from "@/onboarding/store";
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
  const alreadyCustomer = await isCustomer(resolvedSlug);
  const showPurchaseBar =
    appearance !== "zbrendiraj" && !alreadyCustomer;

  let onboardingUrl: string | null = null;
  let contactName: string | null = null;

  if (alreadyCustomer) {
    let onboarding = await getOnboardingBySlug(resolvedSlug);
    if (!onboarding) {
      ({ onboarding } = await ensureOnboardingAccess({ slug: resolvedSlug }));
    }
    if (onboarding) {
      onboardingUrl = getOnboardingUrl(resolvedSlug, onboarding.accessToken);
      contactName = onboarding.contactName;
    }
  }

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
      {alreadyCustomer && onboardingUrl ? (
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
