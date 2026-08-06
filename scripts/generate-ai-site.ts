import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { generateBusinessInput } from "../src/ai/generate-business-input";
import {
  generateSiteConfig,
  type BusinessInput,
} from "../src/ai/generate-site-config";
import { validateSiteConfig } from "../src/content/validate-site-config";
import { createFileSource } from "../src/sources/file-source";

const root = resolve(__dirname, "..");
const sitesDir = resolve(root, "src/content/sites");
const businessDir = resolve(root, "src/content/business");

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBusinessInputObject(value: unknown): value is BusinessInput {
  return isRecord(value) && "companyName" in value;
}

async function readBusinessInput(
  inputPath: string,
): Promise<{ businessInput: BusinessInput; generated: boolean }> {
  const rawContent = readFileSync(inputPath, "utf8").trim();

  try {
    const parsed: unknown = JSON.parse(rawContent);

    if (isBusinessInputObject(parsed)) {
      return { businessInput: parsed, generated: false };
    }
  } catch {
    // Fall through to RawBusinessData generation.
  }

  const source = createFileSource(inputPath);
  const rawBusiness = await source.getBusiness();

  return {
    businessInput: await generateBusinessInput(rawBusiness),
    generated: true,
  };
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

  const { businessInput, generated } = await readBusinessInput(inputPath);

  if (generated) {
    mkdirSync(businessDir, { recursive: true });
    writeFileSync(
      resolve(businessDir, `${slug}.json`),
      `${JSON.stringify(businessInput, null, 2)}\n`,
      "utf8",
    );
  }

  const config = validateSiteConfig(await generateSiteConfig(businessInput));

  writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  console.log(`Generated site config: src/content/sites/${slug}.json`);
  if (generated) {
    console.log(`Saved business input: src/content/business/${slug}.json`);
  }
  console.log(`Run with: SITE_SLUG=${slug} npm run dev`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
