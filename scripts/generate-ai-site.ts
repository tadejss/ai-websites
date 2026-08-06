import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  generateSiteConfig,
  type BusinessInput,
} from "../src/ai/generate-site-config";
import { validateSiteConfig } from "../src/content/validate-site-config";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const root = resolve(__dirname, "..");
const sitesDir = resolve(root, "src/content/sites");

function usage(): never {
  console.error("Usage: npm run generate-ai-site -- <slug> <input-json-path>");
  console.error(
    "Example: npm run generate-ai-site -- kavarna-central scripts/site-input.example.json",
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const slug = process.argv[2];
  const inputPathArg = process.argv[3];

  if (!slug || !inputPathArg) {
    usage();
  }

  if (!SLUG_PATTERN.test(slug)) {
    console.error(
      `Invalid slug "${slug}". Use lowercase letters, numbers, and hyphens only.`,
    );
    process.exit(1);
  }

  const inputPath = resolve(process.cwd(), inputPathArg);

  if (!existsSync(inputPath)) {
    console.error(`Business input file not found: ${inputPath}`);
    process.exit(1);
  }

  const targetPath = resolve(sitesDir, `${slug}.json`);

  if (existsSync(targetPath)) {
    console.error(`Site already exists: src/content/sites/${slug}.json`);
    process.exit(1);
  }

  let businessInput: BusinessInput;

  try {
    businessInput = JSON.parse(readFileSync(inputPath, "utf8")) as BusinessInput;
  } catch {
    console.error(`Invalid business input JSON: ${inputPath}`);
    process.exit(1);
  }

  const config = validateSiteConfig(await generateSiteConfig(businessInput));

  writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  console.log(`Generated site config: src/content/sites/${slug}.json`);
  console.log(`Run with: SITE_SLUG=${slug} npm run dev`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
