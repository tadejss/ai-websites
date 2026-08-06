import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateSiteConfig } from "../src/content/validate-site-config";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const root = resolve(__dirname, "..");
const templatePath = resolve(
  root,
  "src/content/sites/_templates/empty.json",
);
const sitesDir = resolve(root, "src/content/sites");

function usage(): never {
  console.error("Usage: npm run new-site -- <slug>");
  console.error("Example: npm run new-site -- kavarna-central");
  process.exit(1);
}

const slug = process.argv[2];

if (!slug) {
  usage();
}

if (!SLUG_PATTERN.test(slug)) {
  console.error(
    `Invalid slug "${slug}". Use lowercase letters, numbers, and hyphens only.`,
  );
  process.exit(1);
}

if (!existsSync(templatePath)) {
  console.error(`Template not found: ${templatePath}`);
  process.exit(1);
}

const targetPath = resolve(sitesDir, `${slug}.json`);

if (existsSync(targetPath)) {
  console.error(`Site already exists: src/content/sites/${slug}.json`);
  process.exit(1);
}

let rawTemplate: unknown;

try {
  rawTemplate = JSON.parse(readFileSync(templatePath, "utf8"));
} catch {
  console.error(`Invalid template JSON: ${templatePath}`);
  process.exit(1);
}

let config;

try {
  config = validateSiteConfig(rawTemplate);
} catch (error) {
  console.error("Template validation failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

console.log(`Created site config: src/content/sites/${slug}.json`);
console.log(`Run with: SITE_SLUG=${slug} npm run dev`);
