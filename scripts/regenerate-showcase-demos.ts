import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { generateSiteConfig } from "../src/ai/generate-site-config";
import type { BusinessInput } from "../src/ai/types";
import { appearanceForCategory } from "../src/catalog/category-appearance-map";
import { appearanceForIndustry } from "../src/appearances/industry-appearance";
import {
  SHOWCASE_REFERENCE_SLUGS,
  type ShowcaseReferenceSlug,
} from "../src/billing/showcase-slugs";
import {
  applyNewLeadSectionDefaults,
  normalizeGallerySection,
  withSectionNavLinks,
} from "../src/content/apply-new-lead-sections";
import { validateSiteConfig } from "../src/content/validate-site-config";
import type { GalleryItem, SiteConfig } from "../src/content/types/site";
import { generateSiteImages } from "../src/images/generate-site-images";
import { resolveImagePoolCategory } from "../src/images/image-pool-category";
import { sectionProfile } from "../src/templates/category-section-profile";
import { isPaletteCompatibleWithTemplate } from "../src/templates/assign-palette";
import type { TemplateId } from "../src/templates/types";
import { isCuratedPaletteId } from "../src/theme/palettes/curated";

const root = resolve(__dirname, "..");

loadEnv({ path: resolve(root, ".env.local") });

/**
 * Distinct template + curated palette per showcase demo (zbrendiraj.si Primeri).
 * All four templates; four different palettes.
 */
const SHOWCASE_VISUAL: Record<
  ShowcaseReferenceSlug,
  { templateId: TemplateId; paletteId: string }
> = {
  "frizerski-salon-luna": {
    templateId: "floating",
    paletteId: "burgundy-cream",
  },
  "keramicarstvo-hribar": {
    templateId: "outlined",
    paletteId: "clay-ember",
  },
  "elektro-instalacije-kovac": {
    templateId: "type",
    paletteId: "charcoal-signal",
  },
  "krovstvo-petek": {
    templateId: "bento",
    paletteId: "obsidian-lime",
  },
};

type ShowcaseSectionVariant = "all" | "no-gallery" | "no-pricing";

/** Keep light section variety on gallery/pricing; expanded flags come from profile. */
const SHOWCASE_SECTION_VARIANTS: Record<
  ShowcaseReferenceSlug,
  ShowcaseSectionVariant
> = {
  "frizerski-salon-luna": "all",
  "keramicarstvo-hribar": "all",
  "elektro-instalacije-kovac": "all",
  "krovstvo-petek": "all",
};

function galleryItemsFromImages(config: SiteConfig): GalleryItem[] {
  const items: GalleryItem[] = [];

  if (config.images?.hero?.src) {
    items.push({
      src: config.images.hero.src,
      alt: config.images.hero.alt || "Ambient",
    });
  }

  if (config.images?.services?.src) {
    items.push({
      src: config.images.services.src,
      alt: config.images.services.alt || "Storitve",
    });
  }

  return items;
}

function applyShowcaseSectionVariant(
  config: SiteConfig,
  variant: ShowcaseSectionVariant,
): SiteConfig {
  const showGallery = variant !== "no-gallery";
  const showPricing = variant !== "no-pricing";
  const galleryItems = showGallery
    ? config.gallery?.items?.length
      ? config.gallery.items
      : galleryItemsFromImages(config)
    : [];

  return withSectionNavLinks({
    ...config,
    sections: {
      ...config.sections,
      gallery: showGallery,
      pricing: showPricing,
    },
    gallery: normalizeGallerySection({
      ...config.gallery,
      items: galleryItems,
    }),
  });
}

function writeJsonFile(filePath: string, data: unknown): void {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function regenerateShowcaseDemo(slug: string): Promise<void> {
  const clientDir = resolve(root, "src/content/clients", slug);
  const businessPath = resolve(clientDir, "business.json");
  const sitePath = resolve(clientDir, "site.json");
  const visual = SHOWCASE_VISUAL[slug as ShowcaseReferenceSlug];

  if (!existsSync(businessPath)) {
    throw new Error(`Missing business.json for "${slug}"`);
  }
  if (!visual) {
    throw new Error(`No showcase visual config for "${slug}"`);
  }
  if (!isCuratedPaletteId(visual.paletteId)) {
    throw new Error(`Palette "${visual.paletteId}" is not curated`);
  }
  if (!isPaletteCompatibleWithTemplate(visual.paletteId, {
    templateId: visual.templateId,
  })) {
    throw new Error(
      `Palette "${visual.paletteId}" is not compatible with template "${visual.templateId}"`,
    );
  }

  const businessInput = JSON.parse(
    readFileSync(businessPath, "utf8"),
  ) as BusinessInput;

  console.log(`\n== ${slug} ==`);
  console.log(
    `Visual: template=${visual.templateId} palette=${visual.paletteId}`,
  );
  console.log("Generating site config…");
  const generatedConfig = await generateSiteConfig(businessInput);

  const categoryId = resolveImagePoolCategory({
    industry: businessInput.industry,
    companyName: businessInput.companyName,
    services: businessInput.services,
  });
  const appearance = categoryId
    ? appearanceForCategory(categoryId)
    : appearanceForIndustry(
        `${businessInput.industry ?? ""} ${businessInput.companyName ?? ""}`,
      );

  const siteConfig: SiteConfig = {
    ...generatedConfig,
    appearance,
    templateId: visual.templateId,
    theme: {
      ...(generatedConfig.theme ?? { paletteId: visual.paletteId }),
      paletteId: visual.paletteId,
    },
  };

  console.log("Generating images…");
  const media = await generateSiteImages(slug, businessInput, {
    ...siteConfig,
    // Image plan follows forced template
    templateId: visual.templateId,
  });
  const images = media?.images;
  const withImages: SiteConfig = images
    ? {
        ...siteConfig,
        images,
        ...(media?.galleryItems?.length
          ? {
              gallery: {
                id: "galerija",
                eyebrow: "Galerija",
                title: "Vpogled v naše delo",
                description:
                  siteConfig.gallery?.description ||
                  "Fotografije naših storitev in ambienta.",
                items: media.galleryItems,
              },
            }
          : {}),
      }
    : siteConfig;

  const profile = sectionProfile(categoryId);
  console.log(
    `Sections profile: benefits=${profile.benefits} process=${profile.process} serviceArea=${profile.serviceArea} finalCta=${profile.finalCta}`,
  );

  const withLeadDefaults = applyNewLeadSectionDefaults(withImages, {
    sectionProfile: profile,
    hasExplicitServiceArea: Boolean(businessInput.serviceArea?.trim()),
  });

  const variant = SHOWCASE_SECTION_VARIANTS[slug as ShowcaseReferenceSlug];
  const withSections = applyShowcaseSectionVariant(withLeadDefaults, variant);
  const persistedConfig = validateSiteConfig(withSections);

  mkdirSync(resolve(clientDir, "assets"), { recursive: true });
  writeJsonFile(sitePath, persistedConfig);

  console.log(`Saved ${sitePath}`);
  console.log(
    `  flags=${JSON.stringify(persistedConfig.sections)} steps=${
      persistedConfig.whyChooseUs.steps?.items?.length ?? 0
    } faq=${persistedConfig.contact.faq?.length ?? 0} serviceArea=${Boolean(
      persistedConfig.serviceArea,
    )}`,
  );
  if (images?.hero?.src) {
    console.log(`  hero: ${images.hero.src}`);
  }
  if (media?.galleryItems?.length) {
    console.log(`  gallery: ${media.galleryItems.length} items`);
  }
}

async function main(): Promise<void> {
  const slugArg = process.argv.slice(2).find((arg) => !arg.startsWith("--"))
    ?.trim();
  const slugs = slugArg ? [slugArg] : [...SHOWCASE_REFERENCE_SLUGS];

  for (const slug of slugs) {
    if (!(SHOWCASE_REFERENCE_SLUGS as readonly string[]).includes(slug)) {
      console.error(`"${slug}" is not a showcase reference slug.`);
      process.exit(1);
    }
    await regenerateShowcaseDemo(slug);
  }

  console.log(`\nDone. Regenerated ${slugs.length} showcase demo(s).`);
  console.log("Open:");
  for (const slug of slugs) {
    const v = SHOWCASE_VISUAL[slug as ShowcaseReferenceSlug];
    console.log(
      `  http://127.0.0.1:3020/${slug}  (${v.templateId} / ${v.paletteId})`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
