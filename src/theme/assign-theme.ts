import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  isTradeAppearance,
  type AppearanceId,
} from "@/appearances/types";
import { getFontPairingsForMode } from "./fonts/pairings";
import { getPalettesForMode } from "./palettes";
import type { Palette, SiteTheme, ThemeMode } from "./types";

/** Pink / pastel / low-contrast palettes excluded from trade light assignment. */
const TRADE_EXCLUDED_LIGHT_PALETTE_IDS = new Set([
  "dusty-rose",
  "lavender-cream",
  "peach-bloom",
  "blush-champagne",
  "plum-dusk",
  "wine-velvet",
  "sage-meadow",
  "moss-linen",
  "caramel-vanilla",
  "coastal-fog",
]);

/** Pink-accent / brand-only palettes excluded from trade dark assignment. */
const TRADE_EXCLUDED_DARK_PALETTE_IDS = new Set([
  "burgundy-glow",
  "zbrendiraj",
]);

function hashString(value: string): number {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return Math.abs(hash);
}

export function appearanceToMode(
  appearance: AppearanceId,
  slug = "",
): ThemeMode {
  if (appearance === "beauty") {
    return "light";
  }

  if (isTradeAppearance(appearance)) {
    return hashString(`${slug}:mode`) % 2 === 0 ? "light" : "dark";
  }

  return "dark";
}

function getPalettesForAppearance(
  appearance: AppearanceId,
  mode: ThemeMode,
): Palette[] {
  const palettes = getPalettesForMode(mode);

  if (!isTradeAppearance(appearance)) {
    return palettes;
  }

  if (mode === "light") {
    return palettes.filter(
      (palette) => !TRADE_EXCLUDED_LIGHT_PALETTE_IDS.has(palette.id),
    );
  }

  return palettes.filter(
    (palette) => !TRADE_EXCLUDED_DARK_PALETTE_IDS.has(palette.id),
  );
}

function themeKey(theme: SiteTheme): string {
  return `${theme.paletteId}::${theme.fontPairingId}`;
}

function getClientsDir(): string {
  return resolve(process.cwd(), "src/content/clients");
}

export function getUsedThemePairs(): Set<string> {
  const clientsDir = getClientsDir();

  if (!existsSync(clientsDir)) {
    return new Set();
  }

  const used = new Set<string>();

  for (const entry of readdirSync(clientsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const sitePath = resolve(clientsDir, entry.name, "site.json");

    if (!existsSync(sitePath)) {
      continue;
    }

    try {
      const parsed = JSON.parse(readFileSync(sitePath, "utf8")) as {
        theme?: SiteTheme;
      };

      if (parsed.theme?.paletteId && parsed.theme?.fontPairingId) {
        used.add(themeKey(parsed.theme));
      }
    } catch {
      // Ignore malformed site configs when scanning for collisions.
    }
  }

  return used;
}

export function assignTheme(
  slug: string,
  appearance: AppearanceId,
  usedPairs: Set<string> = getUsedThemePairs(),
): SiteTheme {
  const mode = appearanceToMode(appearance, slug);
  const palettes = getPalettesForAppearance(appearance, mode);
  const pairings = getFontPairingsForMode(mode);

  if (palettes.length === 0 || pairings.length === 0) {
    throw new Error(`No palettes or font pairings available for mode "${mode}".`);
  }

  const paletteStart = hashString(slug) % palettes.length;
  const pairingStart = hashString(`${slug}:font`) % pairings.length;
  const combinations = palettes.length * pairings.length;

  for (let offset = 0; offset < combinations; offset += 1) {
    const palette = palettes[(paletteStart + offset) % palettes.length];
    const pairing =
      pairings[(pairingStart + Math.floor(offset / palettes.length)) % pairings.length];
    const candidate = {
      paletteId: palette.id,
      fontPairingId: pairing.id,
    };

    if (!usedPairs.has(themeKey(candidate))) {
      return candidate;
    }
  }

  const palette = palettes[paletteStart];
  const pairing = pairings[pairingStart];

  return {
    paletteId: palette.id,
    fontPairingId: pairing.id,
  };
}
