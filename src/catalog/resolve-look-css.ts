import type { CSSProperties } from "react";
import type { SiteLookDefinition } from "@/catalog/types";
import { rhythmToGap } from "@/catalog/archetypes";
import { getCatalogFontPairing } from "@/catalog/fonts";
import { getCatalogPalette } from "@/catalog/palettes";
import { getFontPairing } from "@/theme/fonts/pairings";
import { getPalette } from "@/theme/palettes";
import type { SiteTheme } from "@/theme/types";
import { paletteToTokens, tokensToCssVars } from "@/theme/utils/tokens";

/**
 * Resolves look design tokens + colors/fonts.
 * When `themeOverride` is set (from site.json), its palette/fonts win over the look defaults.
 */
export function resolveLookCssVars(
  look: SiteLookDefinition,
  themeOverride?: SiteTheme,
): CSSProperties {
  const paletteId = themeOverride?.paletteId ?? look.theme.paletteId;
  const fontPairingId =
    themeOverride?.fontPairingId ?? look.theme.fontPairingId;

  const palette = getCatalogPalette(paletteId) ?? getPalette(paletteId);
  const pairing =
    getCatalogFontPairing(fontPairingId) ?? getFontPairing(fontPairingId);

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
    "--radius-button": tokens.radiusButton,
    ...(tokens.radiusIcon ? { "--radius-icon": tokens.radiusIcon } : {}),
    "--shadow-card": tokens.shadowCard ?? "none",
    "--section-gap": rhythmToGap(tokens.sectionRhythm),
    "--heading-tracking": tokens.headingTracking ?? "-0.02em",
    ...(tokens.galleryRadius
      ? { "--gallery-radius": tokens.galleryRadius }
      : {}),
  } as CSSProperties;
}
