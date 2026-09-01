import { darkPalettes } from "./dark";
import { lightPalettes } from "./light";
import { catalogPalettes } from "@/catalog/palettes";
import type { Palette, ThemeMode } from "../types";

export const allPalettes: Palette[] = [
  ...lightPalettes,
  ...darkPalettes,
  ...catalogPalettes,
];

const paletteById = new Map(allPalettes.map((palette) => [palette.id, palette]));

export function getPalette(id: string): Palette | undefined {
  return paletteById.get(id);
}

export function getPalettesForMode(mode: ThemeMode): Palette[] {
  return allPalettes.filter((palette) => palette.mode === mode);
}

export const paletteIds = allPalettes.map((palette) => palette.id);
