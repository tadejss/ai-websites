import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateSiteConfig } from "../src/content/validate-site-config";

const clientsDir = resolve(__dirname, "../src/content/clients");

let updated = 0;

for (const entry of readdirSync(clientsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue;
  }

  const sitePath = resolve(clientsDir, entry.name, "site.json");

  if (!existsSync(sitePath)) {
    continue;
  }

  const raw = JSON.parse(readFileSync(sitePath, "utf8"));
  const validated = validateSiteConfig(raw);

  writeFileSync(sitePath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  updated += 1;
  console.log(`Updated ${entry.name}`);
}

console.log(`\nBackfilled privacy/business on ${updated} site(s).`);
