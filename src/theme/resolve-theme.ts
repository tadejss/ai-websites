import type { CSSProperties } from "react";
import type { AppearanceId } from "@/appearances/types";
import { getFontPairing } from "./fonts/pairings";
import { getPalette } from "./palettes";
import type { SiteTheme } from "./types";
import { paletteToTokens, tokensToCssVars } from "./utils/tokens";

export function resolveThemeCssVars(
  theme: SiteTheme | undefined,
  appearance: AppearanceId,
): CSSProperties | undefined {
  if (!theme) {
    return undefined;
  }

  const palette = getPalette(theme.paletteId);
  const pairing = getFontPairing(theme.fontPairingId);

  if (!palette || !pairing) {
    return undefined;
  }

  const expectedMode = appearance === "beauty" ? "light" : "dark";

  if (palette.mode !== expectedMode || !pairing.modes.includes(expectedMode)) {
    return undefined;
  }

  const colorVars = tokensToCssVars(paletteToTokens(palette));

  return {
    ...colorVars,
    "--font-body": `var(${pairing.body.variable})`,
    "--font-display": `var(${pairing.display.variable})`,
  } as CSSProperties;
}
