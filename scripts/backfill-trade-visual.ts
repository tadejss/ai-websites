import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { assignTradeLayout } from "../src/appearances/trade/assign-layout";
import {
  isTradeAppearance,
  type AppearanceId,
  type TradeAppearanceId,
} from "../src/appearances/types";
import { validateSiteConfig } from "../src/content/validate-site-config";
import { assignTheme, getUsedThemePairs } from "../src/theme/assign-theme";
import type { SiteTheme } from "../src/theme/types";

const clientsDir = resolve(__dirname, "../src/content/clients");

let updated = 0;
let skipped = 0;

const usedPairs = getUsedThemePairs();

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
    theme?: SiteTheme;
    layout?: unknown;
  };

  const appearance = raw.appearance as AppearanceId | undefined;

  if (!appearance || !isTradeAppearance(appearance)) {
    skipped += 1;
    continue;
  }

  const tradeAppearance = appearance as TradeAppearanceId;

  if (raw.theme?.paletteId && raw.theme?.fontPairingId) {
    usedPairs.delete(`${raw.theme.paletteId}::${raw.theme.fontPairingId}`);
  }

  const layout = assignTradeLayout(tradeAppearance, entry.name);
  const theme = assignTheme(entry.name, tradeAppearance, usedPairs);
  usedPairs.add(`${theme.paletteId}::${theme.fontPairingId}`);

  const validated = validateSiteConfig({ ...raw, layout, theme });

  writeFileSync(sitePath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  updated += 1;
  console.log(
    `Updated ${entry.name} -> ${theme.paletteId} / ${theme.fontPairingId} / ${layout.profileId} (${layout.heroAtmosphere}, ${layout.sectionRule}, ${layout.cardStyle})`,
  );
}

console.log(
  `\nBackfilled trade visual on ${updated} site(s). Skipped ${skipped}.`,
);
