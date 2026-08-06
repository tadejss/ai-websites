import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import type { RawBusinessData } from "../src/ai/types/raw-business-data";
import { validateRawBusinessData } from "../src/ai/validate-raw-business-data";
import { generateClient } from "../src/clients/generate-client";
import { createGooglePlacesSource } from "../src/sources/google-places-source";
import type { BusinessSource } from "../src/sources/types";

const root = resolve(__dirname, "..");

loadEnv({ path: resolve(root, ".env.local") });

const MAX_SLUG_WORDS = 3;

const LEGAL_SUFFIX_PATTERNS = [
  /\s*,?\s*d\.?\s*o\.?\s*o\.?\s*\.?\s*$/i,
  /\s*,?\s*d\.?\s*d\.?\s*\.?\s*$/i,
  /\s*,?\s*s\.?\s*p\.?\s*\.?\s*$/i,
  /\s*,?\s*llc\s*\.?\s*$/i,
  /\s*,?\s*ltd\s*\.?\s*$/i,
];

const LEGAL_SUFFIX_WORDS = new Set(["doo", "dd", "sp", "llc", "ltd"]);

const GENERIC_COMPANY_WORDS = new Set([
  "podjetje",
  "company",
  "storitve",
  "storitveno",
  "trgovsko",
]);

const STOP_WORDS = new Set(["in", "and", "i", "the", "a", "an", "of", "for"]);

function normalizeBusinessName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function stripLegalSuffixes(text: string): string {
  let result = text;
  for (const pattern of LEGAL_SUFFIX_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return result.trim();
}

function isMeaningfulWord(word: string): boolean {
  return (
    word.length > 0 &&
    !LEGAL_SUFFIX_WORDS.has(word) &&
    !GENERIC_COMPANY_WORDS.has(word) &&
    !STOP_WORDS.has(word)
  );
}

function slugFromBusinessName(name: string): string {
  const normalized = stripLegalSuffixes(normalizeBusinessName(name));

  const words = normalized
    .split(/[\s/|&,]+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ""))
    .filter(isMeaningfulWord)
    .slice(0, MAX_SLUG_WORDS);

  if (words.length === 0) {
    return "";
  }

  return words.join("-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function clientExists(slug: string): boolean {
  return existsSync(
    resolve(root, "src/content/clients", slug, "site.json"),
  );
}

function createCachedSource(data: RawBusinessData): BusinessSource {
  return {
    async getBusiness() {
      return data;
    },
  };
}

async function main(): Promise<void> {
  const query = process.argv.slice(2).join(" ").trim();

  if (!query) {
    console.error("Error: Missing business search query.");
    console.error('Usage: npm run create-client -- "<business search query>"');
    process.exit(1);
  }

  const source = createGooglePlacesSource(query);
  const rawBusiness = validateRawBusinessData(await source.getBusiness());
  const slug = slugFromBusinessName(rawBusiness.name ?? "");

  if (!slug) {
    console.error("Error: Could not create a slug from the business name.");
    process.exit(1);
  }
  
  if (clientExists(slug)) {
    console.error(`Error: Client "${slug}" already exists.`);
    process.exit(1);
  }
  
  await generateClient(slug, createCachedSource(rawBusiness));
  console.log(`Client generated: ${slug}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
