import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateBusinessInput } from "@/ai/generate-business-input";
import { generateSiteConfig } from "@/ai/generate-site-config";
import { validateRawBusinessData } from "@/ai/validate-raw-business-data";
import { appearanceForIndustry } from "@/appearances/industry-appearance";
import { appearanceForCategory } from "@/catalog/category-appearance-map";
import { generateSiteImages } from "@/images/generate-site-images";
import { resolveImagePoolCategory } from "@/images/image-pool-category";
import type { BusinessInput } from "@/ai/types";
import type { RawBusinessData } from "@/ai/types/raw-business-data";
import type { SiteConfig } from "@/content/types/site";
import { validateSiteConfig } from "@/content/validate-site-config";
import { applyNewLeadSectionDefaults } from "@/content/apply-new-lead-sections";
import { saveLead } from "@/leads/store";
import type { BusinessSource } from "@/sources/types";
import { enqueueQaRunSafe } from "@/qa/enqueue";
import type { QaTrigger } from "@/qa/types";
import { assignTemplate } from "@/templates/assign-template";
import { assignPalette } from "@/templates/assign-palette";
import { getTemplateImagePlan } from "@/templates/image-plan";
import type { TemplateId } from "@/templates/types";

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
  options: {
    qaTrigger?: QaTrigger;
    factoryRunId?: string;
    /** Admin/manual template override for this generation. */
    templateOverride?: TemplateId;
  } = {},
): Promise<void> {
  const rawBusiness = validateRawBusinessData(await source.getBusiness());
  const businessInput = await generateBusinessInput(rawBusiness);
  const generatedConfig = await generateSiteConfig(businessInput);
  const categoryId = resolveImagePoolCategory({
    industry: businessInput.industry,
    companyName: businessInput.companyName,
  });
  const appearance = categoryId
    ? appearanceForCategory(categoryId)
    : appearanceForIndustry(
        `${businessInput.industry ?? ""} ${businessInput.companyName ?? ""}`,
      );

  // Tentative template before images (optimistic imagery).
  let templateId = assignTemplate({
    slug,
    categoryId,
    override: options.templateOverride,
    imageSignals: { hasHeroImage: true, hasServiceImages: true },
  });

  const siteConfigBase = {
    ...generatedConfig,
    appearance,
    templateId,
  } as SiteConfig;

  const media = await generateSiteImages(
    slug,
    businessInput,
    siteConfigBase,
    { imagePlan: getTemplateImagePlan(templateId) },
  );
  const images = media?.images;

  // Re-assign with real image signals (e.g. demote floating when hero missing).
  templateId = assignTemplate({
    slug,
    categoryId,
    override: options.templateOverride,
    imageSignals: {
      hasHeroImage: Boolean(images?.hero?.src),
      hasServiceImages: Boolean(images?.services?.src),
    },
  });

  const paletteId = assignPalette({
    slug,
    categoryId,
    templateId,
  });

  const siteConfig = {
    ...siteConfigBase,
    templateId,
    theme: {
      ...(siteConfigBase.theme ?? {}),
      paletteId,
    },
  };

  const withImages = images ? { ...siteConfig, images } : siteConfig;
  const withGalleryItems =
    media?.galleryItems && media.galleryItems.length > 0
      ? {
          ...withImages,
          gallery: {
            id: "galerija",
            eyebrow: "Galerija",
            title: "Vpogled v naše delo",
            description:
              withImages.gallery?.description ||
              "Fotografije naših storitev in ambienta.",
            items: media.galleryItems,
          },
        }
      : withImages;
  const withSections = applyNewLeadSectionDefaults(withGalleryItems as SiteConfig);
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
