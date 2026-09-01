import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { assignLook } from "../src/catalog/assign-look";
import { getLook } from "../src/catalog/looks";
import { resolveImagePoolCategory } from "../src/images/image-pool-category";
import { validateSiteConfig } from "../src/content/validate-site-config";
import type { SiteConfig } from "../src/content/types/site";

const force = process.argv.includes("--force");

function getClientsDir(): string {
  return resolve(process.cwd(), "src/content/clients");
}

let updated = 0;
let skipped = 0;

for (const entry of readdirSync(getClientsDir(), { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue;
  }

  const sitePath = resolve(getClientsDir(), entry.name, "site.json");
  const businessPath = resolve(getClientsDir(), entry.name, "business.json");

  if (!existsSync(sitePath) || !existsSync(businessPath)) {
    continue;
  }

  const site = JSON.parse(readFileSync(sitePath, "utf8")) as SiteConfig;

  if (site.lookId && !force) {
    skipped += 1;
    continue;
  }

  const business = JSON.parse(readFileSync(businessPath, "utf8")) as {
    industry?: string;
    companyName?: string;
  };

  const categoryId = resolveImagePoolCategory({
    industry: business.industry,
    companyName: business.companyName,
  });

  if (!categoryId) {
    skipped += 1;
    continue;
  }

  const look = force && site.lookId ? getLook(site.lookId) ?? assignLook(categoryId, entry.name) : assignLook(categoryId, entry.name);

  const next = validateSiteConfig({
    ...site,
    lookId: look.id,
    appearance: look.appearance,
    theme: look.theme,
    layout: look.layout,
  });

  writeFileSync(sitePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  updated += 1;
  console.log(`${entry.name}: ${look.id}`);
}

console.log(`\nBackfill complete. Updated ${updated}, skipped ${skipped}.`);
