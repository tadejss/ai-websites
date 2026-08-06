import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { generateBusinessInput } from "../src/ai/generate-business-input";
import {
  generateSiteConfig,
  type BusinessInput,
} from "../src/ai/generate-site-config";
import { validateSiteConfig } from "../src/content/validate-site-config";

const root = resolve(__dirname, "..");
const sitesDir = resolve(root, "src/content/sites");

loadEnv({ path: resolve(root, ".env.local") });

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function usage(): never {
  console.error("Usage: npm run generate-ai-site -- <slug> <input-path>");
  console.error(
    "Example: npm run generate-ai-site -- kavarna-central scripts/site-input.example.json",
  );
  console.error(
    "Example: npm run generate-ai-site -- kavarna-central scripts/business-description.txt",
  );
  process.exit(1);
}

function isBusinessInputObject(value: unknown): value is BusinessInput {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readBusinessInput(inputPath: string): Promise<BusinessInput> {
  const rawContent = readFileSync(inputPath, "utf8").trim();

  try {
    const parsed: unknown = JSON.parse(rawContent);

    if (isBusinessInputObject(parsed)) {
      return parsed;
    }
  } catch {
    // Fall through to plain text generation.
  }

  return generateBusinessInput(rawContent);
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

  const businessInput = await readBusinessInput(inputPath);

  const config = validateSiteConfig(await generateSiteConfig(businessInput));

  writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  console.log(`Generated site config: src/content/sites/${slug}.json`);
  console.log(`Run with: SITE_SLUG=${slug} npm run dev`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
