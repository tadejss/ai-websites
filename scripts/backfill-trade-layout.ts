import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { assignTradeLayout } from "../src/appearances/trade/assign-layout";
import {
  isTradeAppearance,
  type AppearanceId,
  type TradeAppearanceId,
} from "../src/appearances/types";
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

  const appearance = raw.appearance as AppearanceId | undefined;

  if (!appearance || !isTradeAppearance(appearance)) {
    skipped += 1;
    continue;
  }

  if (raw.layout) {
    skipped += 1;
    continue;
  }

  const tradeAppearance = appearance as TradeAppearanceId;
  const layout = assignTradeLayout(tradeAppearance, entry.name);
  const validated = validateSiteConfig({ ...raw, layout });

  writeFileSync(sitePath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  updated += 1;
  console.log(
    `Updated ${entry.name} (${tradeAppearance}) -> ${layout.profileId}`,
  );
}

console.log(
  `\nBackfilled trade layout on ${updated} site(s). Skipped ${skipped}.`,
);
