import type { Palette, ThemeMode, ThemeTokens } from "../types";
import {
  contrastForeground,
  darken,
  lighten,
  mixHex,
  parseHex,
  pickAccent,
  sortByLightness,
} from "./color";

export function deriveThemeTokens(
  swatches: string[],
  mode: ThemeMode,
): ThemeTokens {
  const sorted = sortByLightness(swatches);
  const background = mode === "light" ? sorted[0] : sorted[sorted.length - 1];
  const foreground = mode === "light" ? sorted[sorted.length - 1] : sorted[0];
  const accent = pickAccent(swatches, mode);
  const surface =
    mode === "light"
      ? mixHex(background, sorted[1] ?? foreground, 0.35)
      : mixHex(background, sorted[sorted.length - 2] ?? foreground, 0.25);
  const surfaceElevated =
    mode === "light" ? lighten(surface, 0.04) : lighten(surface, 0.08);
  const muted = mixHex(foreground, background, mode === "light" ? 0.42 : 0.38);
  const accentHover =
    mode === "light" ? darken(accent, 0.14) : lighten(accent, 0.1);
  const accentForeground = contrastForeground(accent);
  const border =
    mode === "light"
      ? `rgba(${hexToRgbTuple(foreground)}, 0.12)`
      : "rgba(255, 255, 255, 0.08)";
  const radiusCard = mode === "light" ? "2rem" : "1rem";

  return {
    background,
    foreground,
    muted,
    accent,
    accentHover,
    accentForeground,
    surface,
    surfaceElevated,
    border,
    radiusCard,
  };
}

function hexToRgbTuple(hex: string): string {
  const { r, g, b } = parseHex(hex);
  return `${r}, ${g}, ${b}`;
}

export function paletteToTokens(palette: Palette): ThemeTokens {
  const derived = deriveThemeTokens(palette.swatches, palette.mode);

  return {
    ...derived,
    ...palette.tokens,
  };
}

export function tokensToCssVars(tokens: ThemeTokens): Record<string, string> {
  return {
    "--background": tokens.background,
    "--foreground": tokens.foreground,
    "--muted": tokens.muted,
    "--accent": tokens.accent,
    "--accent-hover": tokens.accentHover,
    "--accent-foreground": tokens.accentForeground,
    "--surface": tokens.surface,
    "--surface-elevated": tokens.surfaceElevated,
    "--border": tokens.border,
    "--radius-card": tokens.radiusCard,
  };
}
