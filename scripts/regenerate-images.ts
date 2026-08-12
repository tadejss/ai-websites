import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import type { BusinessInput } from "@/ai/types";
import { validateSiteConfig } from "@/content/validate-site-config";
import { generateSiteImages } from "@/images/generate-site-images";

const root = resolve(__dirname, "..");

loadEnv({ path: resolve(root, ".env.local") });

async function main(): Promise<void> {
  const slug = process.argv[2];

  if (!slug) {
    console.error("Error: Missing client slug.");
    console.error("Usage: npm run regenerate-images -- <slug>");
    process.exit(1);
  }

  const clientDir = resolve(root, "src/content/clients", slug);
  const businessPath = resolve(clientDir, "business.json");
  const sitePath = resolve(clientDir, "site.json");

  const businessInput = JSON.parse(
    readFileSync(businessPath, "utf8"),
  ) as BusinessInput;
  const siteConfig = validateSiteConfig(
    JSON.parse(readFileSync(sitePath, "utf8")),
  );

  const images = await generateSiteImages(slug, businessInput, siteConfig);

  if (!images) {
    console.error(`No images generated for "${slug}".`);
    process.exit(1);
  }

  const updated = validateSiteConfig({ ...siteConfig, images });
  writeFileSync(sitePath, `${JSON.stringify(updated, null, 2)}\n`, "utf8");

  console.log(`Updated images for ${slug}:`);
  console.log(`  hero: ${images.hero.src}`);
  console.log(`  services: ${images.services.src}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
