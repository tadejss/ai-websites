import type { CSSProperties } from "react";
import type { SiteLookDefinition } from "@/catalog/types";
import { rhythmToGap } from "@/catalog/archetypes";
import { getCatalogFontPairing } from "@/catalog/fonts";
import { getCatalogPalette } from "@/catalog/palettes";
import { getFontPairing } from "@/theme/fonts/pairings";
import { getPalette } from "@/theme/palettes";
import { paletteToTokens, tokensToCssVars } from "@/theme/utils/tokens";

export function resolveLookCssVars(look: SiteLookDefinition): CSSProperties {
  const palette =
    getCatalogPalette(look.theme.paletteId) ?? getPalette(look.theme.paletteId);
  const pairing =
    getCatalogFontPairing(look.theme.fontPairingId) ??
    getFontPairing(look.theme.fontPairingId);

  if (!palette || !pairing) {
    return {};
  }

  const colorVars = tokensToCssVars(paletteToTokens(palette));
  const tokens = look.designTokens;

  return {
    ...colorVars,
    "--font-body": `var(${pairing.body.variable})`,
    "--font-display": `var(${pairing.display.variable})`,
    "--radius-card": tokens.radiusCard,
    "--shadow-card": tokens.shadowCard ?? "none",
    "--section-gap": rhythmToGap(tokens.sectionRhythm),
    "--heading-tracking": tokens.headingTracking ?? "-0.02em",
    ...(tokens.galleryRadius
      ? { "--gallery-radius": tokens.galleryRadius }
      : {}),
  } as CSSProperties;
}
