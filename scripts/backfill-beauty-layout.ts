import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { assignBeautyLayout } from "../src/appearances/beauty/assign-layout";
import { validateSiteConfig } from "../src/content/validate-site-config";

const clientsDir = resolve(__dirname, "../src/content/clients");

let updated = 0;
let skipped = 0;

for (const entry of readdirSync(clientsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue;
  }

  const sitePath = resolve(clientsDir, entry.name, "site.json");

  if (!existsSync(sitePath)) {
    continue;
  }

  const raw = JSON.parse(readFileSync(sitePath, "utf8")) as {
    appearance?: string;
    layout?: unknown;
  };

  if (raw.appearance !== "beauty") {
    skipped += 1;
    continue;
  }

  if (raw.layout) {
    skipped += 1;
    continue;
  }

  const layout = assignBeautyLayout(entry.name);
  const validated = validateSiteConfig({ ...raw, layout });

  writeFileSync(sitePath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  updated += 1;
  console.log(`Updated ${entry.name} -> ${layout.profileId}`);
}

console.log(
  `\nBackfilled beauty layout on ${updated} site(s). Skipped ${skipped}.`,
);
