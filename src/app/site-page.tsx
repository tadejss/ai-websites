import { resolveAppearance } from "@/appearances/resolve-appearance";
import { CustomerPreparingBar } from "@/billing/CustomerPreparingBar";
import { DemoPurchaseBar } from "@/billing/DemoPurchaseBar";
import { isShowcaseReferenceSlug } from "@/billing/showcase-slugs";
import type { SiteConfig } from "@/content/types/site";
import { readLead } from "@/leads/store";
import { getCustomerChromeState } from "@/onboarding/customer-chrome";
import { resolveTemplateId } from "@/templates/resolve-template";
import { loadTemplatePage } from "@/templates/load-template-page";
import { templateFontClassName } from "@/templates/fonts";
import {
  resolveTemplateStructure,
  mergeTemplatePaletteCssVars,
} from "@/templates/tokens";
import {
  getCuratedPalette,
  mapLegacyPaletteIdToCurated,
  TEMPLATE_DEFAULT_PALETTE_ID,
} from "@/theme/palettes/curated";
import type { TemplateId } from "@/templates/types";
import type { Palette } from "@/theme/types";

type Props = {
  siteConfig: SiteConfig;
  siteSlug?: string;
  /** Local QA override — curated palette id (dev palette-preview only). */
  paletteOverride?: string;
};

function resolveDemoPalette(
  paletteId: string,
  templateId: TemplateId,
): Palette {
  return (
    getCuratedPalette(paletteId) ??
    getCuratedPalette(TEMPLATE_DEFAULT_PALETTE_ID[templateId]) ??
    mapLegacyPaletteIdToCurated(paletteId)
  );
}

export async function SitePage({
  siteConfig,
  siteSlug,
  paletteOverride,
}: Props) {
  const appearance = resolveAppearance(siteConfig.appearance);
  const resolvedSlug = siteSlug ?? process.env.SITE_SLUG ?? "default";
  const lead = readLead(resolvedSlug);
  const { isCustomer, onboardingUrl, contactName, onboardingStatus, businessEmail } =
    await getCustomerChromeState(resolvedSlug);
  const showPurchaseBar =
    appearance !== "zbrendiraj" && !isCustomer && !paletteOverride;

  // Marketing site stays on legacy appearance path (lazy — keep normal demos lean).
  if (appearance === "zbrendiraj") {
    const [{ appearanceRegistry }, { resolveLookForSite }, { resolveLookCssVars }, { resolveThemeCssVars }] =
      await Promise.all([
        import("@/appearances/registry"),
        import("@/catalog/resolve-look"),
        import("@/catalog/resolve-look-css"),
        import("@/theme/resolve-theme"),
      ]);
    const { Page } = appearanceRegistry.zbrendiraj;
    const look = resolveLookForSite(siteConfig);
    const themeStyle = look
      ? resolveLookCssVars(look, siteConfig.theme)
      : resolveThemeCssVars(siteConfig.theme, appearance);

    return (
      <div
        data-appearance={appearance}
        data-look={look?.id}
        style={themeStyle}
        className="min-h-full bg-background text-foreground"
      >
        <Page siteConfig={siteConfig} siteSlug={resolvedSlug} />
        {isCustomer ? (
          <CustomerPreparingBar
            slug={resolvedSlug}
            onboardingUrl={onboardingUrl}
            onboardingStatus={onboardingStatus}
            companyName={lead?.companyName ?? siteConfig.business.name}
            brandHighlight={siteConfig.brand.highlight}
            contactName={contactName}
            businessEmail={businessEmail}
          />
        ) : null}
      </div>
    );
  }

  const templateId = resolveTemplateId(siteConfig);
  const { Page } = await loadTemplatePage(templateId);
  const structure = resolveTemplateStructure(templateId);
  const paletteId =
    paletteOverride ||
    siteConfig.theme?.paletteId ||
    TEMPLATE_DEFAULT_PALETTE_ID[templateId];
  const palette = resolveDemoPalette(paletteId, templateId);
  const themeStyle = mergeTemplatePaletteCssVars(structure, palette, templateId);
  const fontClass = templateFontClassName(templateId);

  return (
    <div
      data-appearance={appearance}
      data-template={templateId}
      data-palette={palette.id}
      style={themeStyle}
      className={`min-h-full ${fontClass}`}
    >
      <Page siteConfig={siteConfig} siteSlug={resolvedSlug} />
      {showPurchaseBar ? (
        <DemoPurchaseBar
          slug={resolvedSlug}
          variant={
            isShowcaseReferenceSlug(resolvedSlug) ? "showcase" : "personalized"
          }
          companyName={lead?.companyName ?? siteConfig.business.name}
          brandHighlight={siteConfig.brand.highlight}
        />
      ) : null}
      {isCustomer ? (
        <CustomerPreparingBar
          slug={resolvedSlug}
          onboardingUrl={onboardingUrl}
          onboardingStatus={onboardingStatus}
          companyName={lead?.companyName ?? siteConfig.business.name}
          brandHighlight={siteConfig.brand.highlight}
          contactName={contactName}
          businessEmail={businessEmail}
        />
      ) : null}
    </div>
  );
}
