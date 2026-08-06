import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateBusinessInput } from "@/ai/generate-business-input";
import { generateSiteConfig } from "@/ai/generate-site-config";
import { validateRawBusinessData } from "@/ai/validate-raw-business-data";
import type { BusinessSource } from "@/sources/types";

function writeJsonFile(filePath: string, data: unknown): void {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function createLeadData(
  slug: string,
  businessInput: any,
  rawBusiness: any,
) {
  return {
    slug,
    url: `/${slug}`,
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
  const siteConfig = await generateSiteConfig(businessInput);

  const clientDir = resolve(__dirname, "../content/clients", slug);

  mkdirSync(resolve(clientDir, "assets"), { recursive: true });

  writeJsonFile(resolve(clientDir, "business.json"), businessInput);
  writeJsonFile(resolve(clientDir, "site.json"), siteConfig);

  const leadsDir = resolve(__dirname, "../content/leads");

  mkdirSync(leadsDir, { recursive: true });

  writeJsonFile(
    resolve(leadsDir, `${slug}.json`),
    createLeadData(slug, businessInput, rawBusiness),
  );
}
