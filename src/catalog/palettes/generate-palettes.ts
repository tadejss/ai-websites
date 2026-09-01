import type { ImagePoolCategoryId } from "@/images/image-pool-category";
import type { Palette, ThemeMode } from "@/theme/types";
import { LOOK_ARCHETYPES } from "@/catalog/archetypes";
import { validatePaletteContrast } from "@/catalog/contrast/validate-palette";
import {
  contrastForeground,
  contrastRatio,
  darken,
  lighten,
  mixHex,
  toHex,
} from "@/theme/utils/color";
import { deriveThemeTokens, paletteToTokens } from "@/theme/utils/tokens";

type Rgb = { r: number; g: number; b: number };

function hslToRgb(h: number, s: number, l: number): Rgb {
  const hue = h / 360;
  const sat = s / 100;
  const light = l / 100;

  if (sat === 0) {
    const value = Math.round(light * 255);
    return { r: value, g: value, b: value };
  }

  const hueToRgb = (p: number, q: number, t: number) => {
    let channel = t;
    if (channel < 0) channel += 1;
    if (channel > 1) channel -= 1;
    if (channel < 1 / 6) return p + (q - p) * 6 * channel;
    if (channel < 1 / 2) return q;
    if (channel < 2 / 3) return p + (q - p) * (2 / 3 - channel) * 6;
    return p;
  };

  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;

  return {
    r: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hue) * 255),
    b: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  };
}

function hslToHex(h: number, s: number, l: number): string {
  return toHex(hslToRgb(h, s, l));
}

/** Base hue per category for distinct family tinting. */
const CATEGORY_HUES: Record<ImagePoolCategoryId, number> = {
  frizerji: 340,
  kozmeticarji: 320,
  "nohti-pedikura": 350,
  "maserji-wellness": 155,
  vulkanizerji: 210,
  "avtokleparji-licarji": 205,
  avtomehaniki: 215,
  elektricarji: 48,
  "vodovodarji-ogrevanje": 200,
  keramicarji: 28,
  slikopleskarji: 185,
  suhomontazerji: 35,
  "mizarji-tesarji": 32,
  "parketarji-talne-obloge": 38,
  gradbinci: 22,
  "cistilni-servisi": 195,
};

const ARCHETYPE_MOODS = [
  "sand",
  "slate",
  "bloom",
  "stone",
  "mist",
  "clay",
  "linen",
  "copper",
  "dusk",
  "frost",
] as const;

function buildSwatches(
  hue: number,
  index: number,
  mode: ThemeMode,
): [string, string, string, string, string] {
  const hueShift = (index - 4.5) * 6;
  const baseHue = (hue + hueShift + 360) % 360;

  if (mode === "light") {
    const background = hslToHex(baseHue, 18 + index * 2, 96 - index);
    const light = hslToHex(baseHue, 28 + index, 82 - index);
    const accent = hslToHex(baseHue, 48 + index * 2, 48 - index);
    const mid = hslToHex(baseHue, 32 + index, 32);
    const dark = hslToHex(baseHue, 24 + index, 16 + index * 0.5);
    return [background, light, accent, mid, dark];
  }

  const background = hslToHex(baseHue, 12 + index, 10 + index * 0.4);
  const surface = hslToHex(baseHue, 16 + index, 16 + index * 0.5);
  const accent = hslToHex(baseHue, 42 + index * 2, 58 + index);
  const mid = hslToHex(baseHue, 20 + index, 72);
  const light = hslToHex(baseHue, 14 + index, 88);
  return [light, mid, accent, surface, background];
}

function refinePaletteTokens(palette: Palette): Palette {
  let current = palette;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const result = validatePaletteContrast(current);
    if (result.ok) {
      return current;
    }

    const tokens = paletteToTokens(current);
    const failure = result.failures[0]?.pair;
    const overrides = { ...current.tokens };

    if (failure === "accent/background") {
      const accent =
        current.mode === "light"
          ? darken(tokens.accent, 0.08)
          : lighten(tokens.accent, 0.08);
      overrides.accent = accent;
      overrides.accentHover =
        current.mode === "light" ? darken(accent, 0.12) : lighten(accent, 0.1);
      overrides.accentForeground = contrastForeground(accent);
    } else if (failure === "accentForeground/accent") {
      const accent =
        current.mode === "light"
          ? darken(tokens.accent, 0.1)
          : lighten(tokens.accent, 0.1);
      overrides.accent = accent;
      overrides.accentForeground = contrastForeground(accent);
    } else if (failure === "muted/background" || failure === "foreground/background") {
      const foreground =
        current.mode === "light"
          ? darken(tokens.foreground, 0.08)
          : lighten(tokens.foreground, 0.08);
      overrides.foreground = foreground;
      overrides.muted = mixHex(
        foreground,
        tokens.background,
        current.mode === "light" ? 0.55 : 0.45,
      );
    } else if (failure === "foreground/surface") {
      overrides.surface =
        current.mode === "light"
          ? lighten(tokens.surface, 0.06)
          : darken(tokens.surface, 0.06);
    }

    current = { ...current, tokens: overrides };
  }

  const tokens = deriveThemeTokens(current.swatches, current.mode);
  return {
    ...current,
    tokens: {
      ...tokens,
      accent:
        contrastRatio(tokens.accent, tokens.background) >= 3
          ? tokens.accent
          : current.mode === "light"
            ? darken(tokens.accent, 0.2)
            : lighten(tokens.accent, 0.2),
      muted:
        contrastRatio(tokens.muted, tokens.background) >= 4.5
          ? tokens.muted
          : mixHex(tokens.foreground, tokens.background, 0.58),
      accentForeground: contrastForeground(tokens.accent),
    },
  };
}

function refineSwatchesForContrast(
  swatches: [string, string, string, string, string],
  mode: ThemeMode,
): [string, string, string, string, string] {
  let current = [...swatches] as [string, string, string, string, string];
  const palette: Palette = {
    id: "temp",
    name: "temp",
    mode,
    swatches: current,
  };

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = validatePaletteContrast(palette);
    if (result.ok) {
      return current;
    }

    const failure = result.failures[0]?.pair;
    if (failure === "muted/background" || failure === "foreground/background") {
      if (mode === "light") {
        current[4] = darken(current[4], 0.08);
        current[3] = darken(current[3], 0.06);
      } else {
        current[0] = lighten(current[0], 0.08);
        current[1] = lighten(current[1], 0.06);
      }
    } else if (failure === "accent/background") {
      if (mode === "light") {
        current[2] = darken(current[2], 0.1);
      } else {
        current[2] = lighten(current[2], 0.1);
      }
    } else if (failure === "accentForeground/accent") {
      current[2] = mode === "light" ? darken(current[2], 0.08) : lighten(current[2], 0.08);
    } else if (failure === "foreground/surface") {
      if (mode === "light") {
        current[0] = mixHex(current[0], current[4], 0.15);
      } else {
        current[3] = mixHex(current[3], current[0], 0.15);
      }
    }

    palette.swatches = current;
  }

  return current;
}

export function generateCategoryPalettes(
  categoryId: ImagePoolCategoryId,
  appearanceMode: "beauty" | "trade",
): Palette[] {
  const baseHue = CATEGORY_HUES[categoryId];
  const palettes: Palette[] = [];

  for (let index = 0; index < LOOK_ARCHETYPES.length; index += 1) {
    const archetype = LOOK_ARCHETYPES[index]!;
    const num = String(index + 1).padStart(2, "0");
    const mood = ARCHETYPE_MOODS[index]!;
    const preferDark =
      appearanceMode === "trade" && archetype.preferDark === true;
    const mode: ThemeMode =
      appearanceMode === "beauty" ? "light" : preferDark ? "dark" : "light";

    const rawSwatches = buildSwatches(baseHue, index, mode);
    const swatches = refineSwatchesForContrast(rawSwatches, mode);

    palettes.push(
      refinePaletteTokens({
        id: `look-${categoryId}-${num}-${mood}`,
        name: `${categoryId} ${archetype.displaySuffix}`,
        mode,
        swatches,
      }),
    );
  }

  return palettes;
}

export function generateAllCatalogPalettes(
  categories: ImagePoolCategoryId[],
  appearanceForCategory: (id: ImagePoolCategoryId) => "beauty" | "trade",
): Palette[] {
  return categories.flatMap((categoryId) =>
    generateCategoryPalettes(
      categoryId,
      appearanceForCategory(categoryId),
    ),
  );
}
