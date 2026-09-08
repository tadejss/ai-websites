import type { ImagePoolCategoryId } from "@/images/image-pool-category";
import type { Palette, ThemeMode, ThemeTokens } from "../types";
import { darken, lighten } from "../utils/color";

/**
 * Curated design-system palettes (exactly 14).
 *
 * Contrast tweaks from brief hex (AA):
 * - ink-coral accent #E23D2A → #D32F1F (accentForeground)
 * - clay-ember accent #D35400 → #C24A00 (accentForeground)
 * - electric-navy accent #0EA5E9 → #1D4ED8 (accent/background)
 * - charcoal-signal accent #FF3B30 → #D70015 (accentForeground)
 */

export type PaletteSuitabilityTag =
  | ImagePoolCategoryId
  | "beauty"
  | "wellness"
  | "trade"
  | "services"
  | "elektro"
  | "auto"
  | "construction"
  | "cleaning"
  | "landscaping"
  | "mizar"
  | "bento"
  | "outlined"
  | "type"
  | "floating"
  | "all";

export type CuratedPalette = Palette & {
  suitableFor: PaletteSuitabilityTag[];
  preferredFor?: PaletteSuitabilityTag[];
  avoidFor?: PaletteSuitabilityTag[];
};

function lightTokens(input: {
  background: string;
  surface: string;
  foreground: string;
  primary: string;
  accent: string;
  primaryForeground: string;
  accentForeground: string;
  muted?: string;
  border?: string;
}): ThemeTokens {
  return {
    background: input.background,
    surface: input.surface,
    surfaceElevated: input.surface,
    foreground: input.foreground,
    muted: input.muted ?? "#52525B",
    accent: input.accent,
    accentHover: darken(input.accent, 0.1),
    accentForeground: input.accentForeground,
    border: input.border ?? "rgba(10, 10, 10, 0.12)",
    radiusCard: "1rem",
  };
}

function darkTokens(input: {
  background: string;
  surface: string;
  foreground: string;
  primary: string;
  accent: string;
  primaryForeground: string;
  accentForeground: string;
  muted?: string;
  border?: string;
}): ThemeTokens {
  return {
    background: input.background,
    surface: input.surface,
    surfaceElevated: lighten(input.surface, 0.06),
    foreground: input.foreground,
    muted: input.muted ?? "#A1A1AA",
    accent: input.accent,
    accentHover: lighten(input.accent, 0.08),
    accentForeground: input.accentForeground,
    border: input.border ?? "rgba(255, 255, 255, 0.12)",
    radiusCard: "1rem",
  };
}

function swatchesFrom(
  background: string,
  surface: string,
  accent: string,
  muted: string,
  foreground: string,
): [string, string, string, string, string] {
  return [background, surface, accent, muted, foreground];
}

const BEAUTY: PaletteSuitabilityTag[] = [
  "beauty",
  "wellness",
  "frizerji",
  "kozmeticarji",
  "nohti-pedikura",
  "maserji-wellness",
];

const TRADE: PaletteSuitabilityTag[] = [
  "trade",
  "services",
  "elektro",
  "elektricarji",
  "construction",
  "gradbinci",
  "keramicarji",
  "slikopleskarji",
  "suhomontazerji",
  "mizarji-tesarji",
  "parketarji-talne-obloge",
  "vodovodarji-ogrevanje",
  "cleaning",
  "cistilni-servisi",
  "auto",
  "vulkanizerji",
  "avtomehaniki",
  "avtokleparji-licarji",
];

export const CURATED_PALETTES: CuratedPalette[] = [
  {
    id: "ink-coral",
    name: "Ink Coral",
    mode: "light",
    swatches: swatchesFrom("#FAFAF8", "#FFFFFF", "#D32F1F", "#52525B", "#0A0A0A"),
    tokens: lightTokens({
      background: "#FAFAF8",
      surface: "#FFFFFF",
      foreground: "#0A0A0A",
      primary: "#D32F1F",
      accent: "#D32F1F",
      primaryForeground: "#FFFFFF",
      accentForeground: "#FFFFFF",
    }),
    suitableFor: [...TRADE, "auto", "services"],
    preferredFor: ["auto", "vulkanizerji", "avtomehaniki", "avtokleparji-licarji"],
    avoidFor: BEAUTY,
  },
  {
    id: "cobalt-cream",
    name: "Cobalt Cream",
    mode: "light",
    swatches: swatchesFrom("#F7F8FC", "#FFFFFF", "#1D4ED8", "#52525B", "#0B1220"),
    tokens: lightTokens({
      background: "#F7F8FC",
      surface: "#FFFFFF",
      foreground: "#0B1220",
      primary: "#1D4ED8",
      accent: "#1D4ED8",
      primaryForeground: "#FFFFFF",
      accentForeground: "#FFFFFF",
    }),
    suitableFor: [...TRADE, "services", "elektro", "elektricarji"],
    preferredFor: ["elektricarji", "elektro", "services"],
    avoidFor: BEAUTY,
  },
  {
    id: "forest-signal",
    name: "Forest Signal",
    mode: "light",
    swatches: swatchesFrom("#F6F8F5", "#FFFFFF", "#0F7A45", "#52525B", "#0C1210"),
    tokens: lightTokens({
      background: "#F6F8F5",
      surface: "#FFFFFF",
      foreground: "#0C1210",
      primary: "#0F7A45",
      accent: "#0F7A45",
      primaryForeground: "#FFFFFF",
      accentForeground: "#FFFFFF",
    }),
    suitableFor: [...TRADE, "construction", "landscaping", "gradbinci"],
    preferredFor: ["gradbinci", "construction", "landscaping"],
    avoidFor: BEAUTY,
  },
  {
    id: "citrus-ink",
    name: "Citrus Ink",
    mode: "light",
    // Deep citrus accent (bright #C4F000 fails as text on cream).
    // Background is a clear sage wash so white cards separate from the page.
    swatches: swatchesFrom("#E2E6D0", "#FFFFFF", "#5C7A00", "#3F4A2A", "#0A0A0A"),
    tokens: lightTokens({
      background: "#E2E6D0",
      surface: "#FFFFFF",
      foreground: "#0A0A0A",
      primary: "#5C7A00",
      accent: "#5C7A00",
      primaryForeground: "#FFFFFF",
      accentForeground: "#FFFFFF",
      muted: "#3F4A2A",
      border: "rgba(10, 10, 10, 0.18)",
    }),
    suitableFor: [...TRADE, "elektro", "elektricarji", "cleaning", "cistilni-servisi"],
    preferredFor: ["elektricarji", "cistilni-servisi", "cleaning"],
    avoidFor: BEAUTY,
  },
  {
    id: "clay-ember",
    name: "Clay Ember",
    mode: "light",
    // Stronger clay wash so white cards/frames separate from the page.
    swatches: swatchesFrom("#E8DCCE", "#FFFFFF", "#C24A00", "#4A3428", "#1A120C"),
    tokens: lightTokens({
      background: "#E8DCCE",
      surface: "#FFFFFF",
      foreground: "#1A120C",
      primary: "#C24A00",
      accent: "#C24A00",
      primaryForeground: "#FFFFFF",
      accentForeground: "#FFFFFF",
      muted: "#4A3428",
      border: "rgba(26, 18, 12, 0.22)",
    }),
    suitableFor: [
      ...TRADE,
      "construction",
      "auto",
      "mizar",
      "mizarji-tesarji",
      "gradbinci",
    ],
    preferredFor: ["mizarji-tesarji", "mizar", "gradbinci", "construction"],
    avoidFor: BEAUTY,
  },
  {
    id: "electric-navy",
    name: "Electric Navy",
    mode: "light",
    swatches: swatchesFrom("#F5F7FB", "#FFFFFF", "#2563EB", "#52525B", "#07101F"),
    tokens: lightTokens({
      background: "#F5F7FB",
      surface: "#FFFFFF",
      foreground: "#07101F",
      primary: "#2563EB",
      accent: "#1D4ED8",
      primaryForeground: "#FFFFFF",
      accentForeground: "#FFFFFF",
    }),
    suitableFor: [...TRADE, "elektro", "elektricarji", "services"],
    preferredFor: ["elektricarji", "elektro"],
    avoidFor: BEAUTY,
  },
  {
    id: "burgundy-cream",
    name: "Burgundy Cream",
    mode: "dark",
    swatches: swatchesFrom("#7A1F3D", "#8F2A4A", "#FBF7F4", "#D4C0C4", "#FBF7F4"),
    tokens: darkTokens({
      background: "#7A1F3D",
      surface: "#8F2A4A",
      foreground: "#FBF7F4",
      primary: "#FBF7F4",
      accent: "#FBF7F4",
      primaryForeground: "#7A1F3D",
      accentForeground: "#7A1F3D",
      muted: "#D4C0C4",
      border: "rgba(251, 247, 244, 0.22)",
    }),
    suitableFor: BEAUTY,
    preferredFor: BEAUTY,
    avoidFor: ["trade", "elektro", "elektricarji", "construction", "gradbinci"],
  },
  {
    id: "deep-plum",
    name: "Deep Plum",
    mode: "light",
    swatches: swatchesFrom("#FAF6F9", "#FFFFFF", "#5B2A6B", "#52525B", "#120814"),
    tokens: lightTokens({
      background: "#FAF6F9",
      surface: "#FFFFFF",
      foreground: "#120814",
      primary: "#5B2A6B",
      accent: "#5B2A6B",
      primaryForeground: "#FFFFFF",
      accentForeground: "#FFFFFF",
    }),
    suitableFor: BEAUTY,
    preferredFor: ["frizerji", "kozmeticarji", "beauty"],
    avoidFor: ["trade", "elektro", "elektricarji", "construction", "gradbinci"],
  },
  {
    id: "olive-ink",
    name: "Olive Ink",
    mode: "light",
    swatches: swatchesFrom("#F7F5EF", "#FFFFFF", "#4A5D23", "#52525B", "#12140E"),
    tokens: lightTokens({
      background: "#F7F5EF",
      surface: "#FFFFFF",
      foreground: "#12140E",
      primary: "#4A5D23",
      accent: "#4A5D23",
      primaryForeground: "#FFFFFF",
      accentForeground: "#FFFFFF",
    }),
    suitableFor: [...BEAUTY, "services"],
    preferredFor: ["maserji-wellness", "wellness"],
    avoidFor: ["elektro", "elektricarji"],
  },
  {
    id: "charcoal-signal",
    name: "Charcoal Signal",
    mode: "light",
    swatches: swatchesFrom("#F4F4F2", "#FFFFFF", "#D70015", "#52525B", "#0A0A0A"),
    tokens: lightTokens({
      background: "#F4F4F2",
      surface: "#FFFFFF",
      foreground: "#0A0A0A",
      primary: "#0A0A0A",
      accent: "#D70015",
      primaryForeground: "#FFFFFF",
      accentForeground: "#FFFFFF",
      border: "rgba(10, 10, 10, 0.18)",
    }),
    suitableFor: ["all", ...TRADE, ...BEAUTY, "type"],
    preferredFor: ["type"],
  },
  {
    id: "obsidian-lime",
    name: "Obsidian Lime",
    mode: "dark",
    swatches: swatchesFrom("#05070A", "#1C2530", "#3DFF9A", "#A1A1AA", "#F4F7FB"),
    tokens: darkTokens({
      background: "#05070A",
      surface: "#1C2530",
      foreground: "#F4F7FB",
      primary: "#3DFF9A",
      accent: "#3DFF9A",
      primaryForeground: "#05070A",
      accentForeground: "#05070A",
      border: "rgba(255, 255, 255, 0.16)",
    }),
    suitableFor: [...TRADE, "elektro", "elektricarji", "bento"],
    preferredFor: ["bento", "elektricarji", "elektro"],
    avoidFor: BEAUTY,
  },
  {
    id: "warm-black",
    name: "Warm Black",
    mode: "dark",
    swatches: swatchesFrom("#120E0C", "#1C1612", "#FF6A3D", "#A1A1AA", "#F7F1EA"),
    tokens: darkTokens({
      background: "#120E0C",
      surface: "#1C1612",
      foreground: "#F7F1EA",
      primary: "#FF6A3D",
      accent: "#FF6A3D",
      primaryForeground: "#120E0C",
      accentForeground: "#120E0C",
    }),
    suitableFor: [...BEAUTY, "auto", "services", ...TRADE],
    preferredFor: BEAUTY,
  },
  {
    id: "midnight-cobalt",
    name: "Midnight Cobalt",
    mode: "dark",
    // Accent-as-background; original #4F7CFF fails AA with light text → deepened cobalt.
    swatches: swatchesFrom("#2547C7", "#2F52D8", "#EEF2FF", "#C5CEF0", "#EEF2FF"),
    tokens: darkTokens({
      background: "#2547C7",
      surface: "#2F52D8",
      foreground: "#EEF2FF",
      primary: "#EEF2FF",
      accent: "#EEF2FF",
      primaryForeground: "#2547C7",
      accentForeground: "#2547C7",
      muted: "#C5CEF0",
      border: "rgba(238, 242, 255, 0.22)",
    }),
    suitableFor: [...TRADE, "elektro", "elektricarji", "services"],
    preferredFor: ["elektricarji", "elektro"],
    avoidFor: BEAUTY,
  },
  {
    id: "charcoal-gold",
    name: "Charcoal Gold",
    mode: "dark",
    swatches: swatchesFrom("#0E0E0E", "#1A1A1A", "#E8B84A", "#A1A1AA", "#F5F5F4"),
    tokens: darkTokens({
      background: "#0E0E0E",
      surface: "#1A1A1A",
      foreground: "#F5F5F4",
      primary: "#E8B84A",
      accent: "#E8B84A",
      primaryForeground: "#0E0E0E",
      accentForeground: "#0E0E0E",
    }),
    suitableFor: BEAUTY,
    preferredFor: BEAUTY,
    avoidFor: ["elektro", "elektricarji", "construction", "gradbinci"],
  },
];

export const CURATED_PALETTE_IDS = CURATED_PALETTES.map((p) => p.id);

export const CURATED_PALETTE_BY_ID = new Map(
  CURATED_PALETTES.map((palette) => [palette.id, palette]),
);

export function isCuratedPaletteId(id: string): boolean {
  return CURATED_PALETTE_BY_ID.has(id);
}

export function getCuratedPalette(id: string): CuratedPalette | undefined {
  return CURATED_PALETTE_BY_ID.get(id);
}

export function curatedPalettesForMode(mode: ThemeMode): CuratedPalette[] {
  return CURATED_PALETTES.filter((palette) => palette.mode === mode);
}

/** Deterministic map from any legacy/unknown id onto a curated palette. */
export function mapLegacyPaletteIdToCurated(id: string): CuratedPalette {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return CURATED_PALETTES[hash % CURATED_PALETTES.length]!;
}

export const TEMPLATE_DEFAULT_PALETTE_ID: Record<
  "bento" | "outlined" | "type" | "floating",
  string
> = {
  bento: "obsidian-lime",
  outlined: "ink-coral",
  type: "charcoal-signal",
  floating: "burgundy-cream",
};
