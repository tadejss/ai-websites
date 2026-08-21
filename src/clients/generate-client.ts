import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateBusinessInput } from "@/ai/generate-business-input";
import { generateSiteConfig } from "@/ai/generate-site-config";
import { validateRawBusinessData } from "@/ai/validate-raw-business-data";
import { appearanceForIndustry } from "@/appearances/industry-appearance";
import { assignBeautyLayout } from "@/appearances/beauty/assign-layout";
import { assignTradeLayout } from "@/appearances/trade/assign-layout";
import { isTradeAppearance } from "@/appearances/types";
import { assignTheme } from "@/theme/assign-theme";
import { generateSiteImages } from "@/images/generate-site-images";
import type { BusinessInput } from "@/ai/types";
import type { RawBusinessData } from "@/ai/types/raw-business-data";
import type { SiteConfig } from "@/content/types/site";
import { validateSiteConfig } from "@/content/validate-site-config";
import { saveLead } from "@/leads/store";
import type { BusinessSource } from "@/sources/types";

function writeJsonFile(filePath: string, data: unknown): void {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function createLeadData(
  slug: string,
  businessInput: BusinessInput,
  rawBusiness: RawBusinessData,
) {
  return {
    slug,
    url: `/${slug}`,
    googlePlaceId: rawBusiness.googlePlaceId ?? "",
    companyName: businessInput.companyName,
    industry: businessInput.industry,
    phone: businessInput.phone,
    address: businessInput.address,
    googleRating: rawBusiness.rating,
    googleReviewCount: rawBusiness.reviewCount,
    existingWebsite: rawBusiness.website ?? "",
    email: businessInput.email?.trim() || undefined,
    status: "generated",
  };
}

export async function generateClient(
  slug: string,
  source: BusinessSource,
): Promise<void> {
  const rawBusiness = validateRawBusinessData(await source.getBusiness());
  const businessInput = await generateBusinessInput(rawBusiness);
  const generatedConfig = await generateSiteConfig(businessInput);
  const appearance = appearanceForIndustry(businessInput.industry ?? "");
  const layout =
    appearance === "beauty"
      ? assignBeautyLayout(slug)
      : isTradeAppearance(appearance)
        ? assignTradeLayout(appearance, slug)
        : undefined;
  const siteConfig = {
    ...generatedConfig,
    appearance,
    theme: assignTheme(slug, appearance),
    ...(layout ? { layout } : {}),
  };
  const images = await generateSiteImages(slug, businessInput, siteConfig as SiteConfig);
  const finalConfig = images ? { ...siteConfig, images } : siteConfig;
  const persistedConfig = validateSiteConfig(finalConfig);

  const clientDir = resolve(__dirname, "../content/clients", slug);

  mkdirSync(resolve(clientDir, "assets"), { recursive: true });

  writeJsonFile(resolve(clientDir, "business.json"), businessInput);
  writeJsonFile(resolve(clientDir, "site.json"), persistedConfig);

  saveLead(createLeadData(slug, businessInput, rawBusiness));
}
