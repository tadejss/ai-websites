import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const root = resolve(__dirname, "..");
const templatePath = resolve(
  root,
  "src/content/sites/_templates/empty.json",
);
const sitesDir = resolve(root, "src/content/sites");

function usage(): never {
  console.error("Usage: npm run create-site -- <slug>");
  console.error("Example: npm run create-site -- kavarna-central");
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

copyFileSync(templatePath, targetPath);

console.log(`Created site config: src/content/sites/${slug}.json`);
console.log(`Run with: SITE_SLUG=${slug} npm run dev`);
