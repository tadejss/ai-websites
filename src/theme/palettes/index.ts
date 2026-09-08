import { darkPalettes } from "./dark";
import { lightPalettes } from "./light";
import { showcasePalettes } from "./showcase";
import { catalogPalettes } from "@/catalog/palettes";
import type { Palette, ThemeMode } from "../types";
import {
  CURATED_PALETTES,
  getCuratedPalette,
  isCuratedPaletteId,
  mapLegacyPaletteIdToCurated,
} from "./curated";

export {
  CURATED_PALETTES,
  CURATED_PALETTE_IDS,
  TEMPLATE_DEFAULT_PALETTE_ID,
  getCuratedPalette,
  isCuratedPaletteId,
  mapLegacyPaletteIdToCurated,
  curatedPalettesForMode,
} from "./curated";
export type { CuratedPalette, PaletteSuitabilityTag } from "./curated";

/** Historical definitions — used only as identity for zbrendiraj + catalog tooling. */
const legacyDefinitions: Palette[] = [
  ...lightPalettes,
  ...darkPalettes,
  ...showcasePalettes,
  ...catalogPalettes,
];

const legacyById = new Map(
  legacyDefinitions.map((palette) => [palette.id, palette]),
);

/** Active design system (14 curated). */
export const curatedPalettes: Palette[] = CURATED_PALETTES;

/**
 * Display/list helper: curated first, then legacy (for collapsible tooling).
 * Prefer curatedPalettes for new UI.
 */
export const allPalettes: Palette[] = [
  ...CURATED_PALETTES,
  ...legacyDefinitions.filter((p) => p.id !== "zbrendiraj"),
  ...legacyDefinitions.filter((p) => p.id === "zbrendiraj"),
];

/**
 * Resolve a palette for rendering / assignment consumers.
 *
 * - zbrendiraj → exact brand definition (never remapped)
 * - curated id → curated palette
 * - any other id → deterministic map onto a curated palette (old demos may recolor)
 */
export function getPalette(id: string): Palette | undefined {
  if (!id) {
    return undefined;
  }

  if (id === "zbrendiraj") {
    return legacyById.get("zbrendiraj");
  }

  if (isCuratedPaletteId(id)) {
    return getCuratedPalette(id);
  }

  // Legacy / unknown: remapped to curated (intentional recolor of old demos).
  return mapLegacyPaletteIdToCurated(id);
}

/** Exact legacy definition without curated remapping (tooling / zbrendiraj tests). */
export function getLegacyPaletteDefinition(id: string): Palette | undefined {
  return legacyById.get(id);
}

export function getPalettesForMode(mode: ThemeMode): Palette[] {
  return CURATED_PALETTES.filter((palette) => palette.mode === mode);
}

/** Soft validation: any non-empty string is accepted; curated + known legacy listed for docs. */
export const paletteIds = [
  ...CURATED_PALETTES.map((p) => p.id),
  ...legacyDefinitions.map((p) => p.id),
];
