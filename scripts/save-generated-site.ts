import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateSiteConfig } from "../src/content/validate-site-config";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const root = resolve(__dirname, "..");
const sitesDir = resolve(root, "src/content/sites");

function usage(): never {
  console.error("Usage: npm run save-site -- <slug> <json-path>");
  console.error(
    "Example: npm run save-site -- kavarna-central ./output/site.json",
  );
  process.exit(1);
}

const slug = process.argv[2];
const jsonPathArg = process.argv[3];

if (!slug || !jsonPathArg) {
  usage();
}

if (!SLUG_PATTERN.test(slug)) {
  console.error(
    `Invalid slug "${slug}". Use lowercase letters, numbers, and hyphens only.`,
  );
  process.exit(1);
}

const sourcePath = resolve(process.cwd(), jsonPathArg);

if (!existsSync(sourcePath)) {
  console.error(`JSON file not found: ${sourcePath}`);
  process.exit(1);
}

const targetPath = resolve(sitesDir, `${slug}.json`);

if (existsSync(targetPath)) {
  console.error(`Site already exists: src/content/sites/${slug}.json`);
  process.exit(1);
}

let rawJson: unknown;

try {
  rawJson = JSON.parse(readFileSync(sourcePath, "utf8"));
} catch {
  console.error(`Invalid JSON file: ${sourcePath}`);
  process.exit(1);
}

let config;

try {
  config = validateSiteConfig(rawJson);
} catch (error) {
  console.error("SiteConfig validation failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

console.log(`Saved site config: src/content/sites/${slug}.json`);
console.log(`Run with: SITE_SLUG=${slug} npm run dev`);
