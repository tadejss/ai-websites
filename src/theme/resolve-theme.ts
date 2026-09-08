import type { CSSProperties } from "react";
import {
  isTradeAppearance,
  type AppearanceId,
} from "@/appearances/types";
import { getFontPairing } from "./fonts/pairings";
import { getLegacyPaletteDefinition, getPalette } from "./palettes";
import type { SiteTheme } from "./types";
import { paletteToTokens, tokensToCssVars } from "./utils/tokens";

export function resolveThemeCssVars(
  theme: SiteTheme | undefined,
  appearance: AppearanceId,
): CSSProperties | undefined {
  if (!theme) {
    return undefined;
  }

  // Appearance path: prefer exact legacy definition (incl. zbrendiraj).
  // Template path uses getPalette remapping separately.
  const palette =
    getLegacyPaletteDefinition(theme.paletteId) ?? getPalette(theme.paletteId);
  const pairing = theme.fontPairingId
    ? getFontPairing(theme.fontPairingId)
    : undefined;

  if (!palette || !pairing) {
    return undefined;
  }

  if (appearance === "beauty" && palette.mode !== "light") {
    return undefined;
  }

  if (
    !isTradeAppearance(appearance) &&
    appearance !== "beauty" &&
    palette.mode !== "dark"
  ) {
    return undefined;
  }

  if (!pairing.modes.includes(palette.mode)) {
    return undefined;
  }

  const colorVars = tokensToCssVars(paletteToTokens(palette));

  return {
    ...colorVars,
    "--font-body": `var(${pairing.body.variable})`,
    "--font-display": `var(${pairing.display.variable})`,
  } as CSSProperties;
}
