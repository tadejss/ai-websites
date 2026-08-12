import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateBusinessInput } from "@/ai/generate-business-input";
import { generateSiteConfig } from "@/ai/generate-site-config";
import { validateRawBusinessData } from "@/ai/validate-raw-business-data";
import { appearanceForIndustry } from "@/appearances/industry-appearance";
import { assignTheme } from "@/theme/assign-theme";
import { generateSiteImages } from "@/images/generate-site-images";
import type { BusinessInput } from "@/ai/types";
import type { RawBusinessData } from "@/ai/types/raw-business-data";
import type { SiteConfig } from "@/content/types/site";
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
  const siteConfig: SiteConfig = {
    ...generatedConfig,
    appearance,
    theme: assignTheme(slug, appearance),
  };
  const images = await generateSiteImages(slug, businessInput, siteConfig);
  const finalConfig: SiteConfig = images ? { ...siteConfig, images } : siteConfig;

  const clientDir = resolve(__dirname, "../content/clients", slug);

  mkdirSync(resolve(clientDir, "assets"), { recursive: true });

  writeJsonFile(resolve(clientDir, "business.json"), businessInput);
  writeJsonFile(resolve(clientDir, "site.json"), finalConfig);

  saveLead(createLeadData(slug, businessInput, rawBusiness));
}
