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
import { assignLook } from "@/catalog/assign-look";
import { resolveImagePoolCategory } from "@/images/image-pool-category";
import { generateSiteImages } from "@/images/generate-site-images";
import type { BusinessInput } from "@/ai/types";
import type { RawBusinessData } from "@/ai/types/raw-business-data";
import type { SiteConfig } from "@/content/types/site";
import { validateSiteConfig } from "@/content/validate-site-config";
import { applyNewLeadSectionDefaults } from "@/content/apply-new-lead-sections";
import { saveLead } from "@/leads/store";
import type { BusinessSource } from "@/sources/types";
import { enqueueQaRunSafe } from "@/qa/enqueue";
import type { QaTrigger } from "@/qa/types";

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
  options: { qaTrigger?: QaTrigger; factoryRunId?: string } = {},
): Promise<void> {
  const rawBusiness = validateRawBusinessData(await source.getBusiness());
  const businessInput = await generateBusinessInput(rawBusiness);
  const generatedConfig = await generateSiteConfig(businessInput);
  const categoryId = resolveImagePoolCategory({
    industry: businessInput.industry,
    companyName: businessInput.companyName,
  });
  const appearance = appearanceForIndustry(
    `${businessInput.industry ?? ""} ${businessInput.companyName ?? ""}`,
  );

  const siteConfig = categoryId
    ? (() => {
        const look = assignLook(categoryId, slug);
        return {
          ...generatedConfig,
          lookId: look.id,
          appearance: look.appearance,
          theme: look.theme,
          layout: look.layout,
        };
      })()
    : {
        ...generatedConfig,
        appearance,
        theme: assignTheme(slug, appearance),
        ...(appearance === "beauty"
          ? { layout: assignBeautyLayout(slug) }
          : isTradeAppearance(appearance)
            ? { layout: assignTradeLayout(appearance, slug) }
            : {}),
      };
  const images = await generateSiteImages(slug, businessInput, siteConfig as SiteConfig);
  const withImages = images ? { ...siteConfig, images } : siteConfig;
  const withSections = applyNewLeadSectionDefaults(withImages as SiteConfig);
  const persistedConfig = validateSiteConfig(withSections);

  const clientDir = resolve(__dirname, "../content/clients", slug);

  mkdirSync(resolve(clientDir, "assets"), { recursive: true });

  writeJsonFile(resolve(clientDir, "business.json"), businessInput);
  writeJsonFile(resolve(clientDir, "site.json"), persistedConfig);

  saveLead(createLeadData(slug, businessInput, rawBusiness));

  await enqueueQaRunSafe({
    slug,
    trigger: options.qaTrigger ?? "cli",
    factoryRunId: options.factoryRunId,
  });
}
