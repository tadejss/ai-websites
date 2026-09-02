import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { generateSiteConfig } from "../src/ai/generate-site-config";
import type { BusinessInput } from "../src/ai/types";
import { appearanceForIndustry } from "../src/appearances/industry-appearance";
import { assignBeautyLayout } from "../src/appearances/beauty/assign-layout";
import { assignTradeLayout } from "../src/appearances/trade/assign-layout";
import { isTradeAppearance } from "../src/appearances/types";
import { assignLook } from "../src/catalog/assign-look";
import { SHOWCASE_REFERENCE_SLUGS } from "../src/billing/showcase-slugs";
import { applyNewLeadSectionDefaults } from "../src/content/apply-new-lead-sections";
import { validateSiteConfig } from "../src/content/validate-site-config";
import type { SiteConfig } from "../src/content/types/site";
import { generateSiteImages } from "../src/images/generate-site-images";
import { resolveImagePoolCategory } from "../src/images/image-pool-category";
import { assignTheme } from "../src/theme/assign-theme";

const root = resolve(__dirname, "..");

loadEnv({ path: resolve(root, ".env.local") });

function writeJsonFile(filePath: string, data: unknown): void {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function migrateShowcaseCatalog(slug: string): Promise<void> {
  const clientDir = resolve(root, "src/content/clients", slug);
  const businessPath = resolve(clientDir, "business.json");
  const sitePath = resolve(clientDir, "site.json");

  if (!existsSync(businessPath) || !existsSync(sitePath)) {
    throw new Error(`Missing business.json or site.json for "${slug}"`);
  }

  const businessInput = JSON.parse(
    readFileSync(businessPath, "utf8"),
  ) as BusinessInput;
  const existingSite = validateSiteConfig(
    JSON.parse(readFileSync(sitePath, "utf8")),
  );

  const categoryId = resolveImagePoolCategory({
    industry: businessInput.industry,
    companyName: businessInput.companyName,
  });

  if (!categoryId) {
    throw new Error(`No image pool category for "${slug}"`);
  }

  const look = assignLook(categoryId, slug);
  console.log(`Look: ${look.id} (${look.appearance})`);

  const withLook = {
    ...existingSite,
    lookId: look.id,
    appearance: look.appearance,
    theme: look.theme,
    layout: look.layout,
  };
  const withSections = applyNewLeadSectionDefaults(withLook);
  const persistedConfig = validateSiteConfig(withSections);

  writeJsonFile(sitePath, persistedConfig);
  console.log(`Saved ${sitePath} (catalog-only, content unchanged)`);
}

async function regenerateShowcaseDemo(slug: string): Promise<void> {
  const clientDir = resolve(root, "src/content/clients", slug);
  const businessPath = resolve(clientDir, "business.json");
  const sitePath = resolve(clientDir, "site.json");

  if (!existsSync(businessPath)) {
    throw new Error(`Missing business.json for "${slug}"`);
  }

  const businessInput = JSON.parse(
    readFileSync(businessPath, "utf8"),
  ) as BusinessInput;

  console.log(`\n== ${slug} ==`);
  console.log("Generating site config…");
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
        console.log(`Look: ${look.id} (${look.appearance})`);
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

  console.log("Generating images…");
  const images = await generateSiteImages(
    slug,
    businessInput,
    siteConfig as SiteConfig,
  );
  const withImages = images ? { ...siteConfig, images } : siteConfig;
  const withSections = applyNewLeadSectionDefaults(withImages as SiteConfig);
  const persistedConfig = validateSiteConfig(withSections);

  mkdirSync(resolve(clientDir, "assets"), { recursive: true });
  writeJsonFile(sitePath, persistedConfig);

  console.log(`Saved ${sitePath}`);
  if (images?.hero?.src) {
    console.log(`  hero: ${images.hero.src}`);
  }
}

async function main(): Promise<void> {
  const catalogOnly = process.argv.includes("--catalog-only");
  const slugArg = process.argv
    .slice(2)
    .find((arg) => arg !== "--catalog-only")
    ?.trim();
  const slugs = slugArg ? [slugArg] : [...SHOWCASE_REFERENCE_SLUGS];

  for (const slug of slugs) {
    if (!(SHOWCASE_REFERENCE_SLUGS as readonly string[]).includes(slug)) {
      console.error(`"${slug}" is not a showcase reference slug.`);
      process.exit(1);
    }
    if (catalogOnly) {
      console.log(`\n== ${slug} (catalog-only) ==`);
      await migrateShowcaseCatalog(slug);
    } else {
      await regenerateShowcaseDemo(slug);
    }
  }

  console.log(
    `\nDone. ${catalogOnly ? "Catalog migrated" : "Regenerated"} ${slugs.length} showcase demo(s).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
