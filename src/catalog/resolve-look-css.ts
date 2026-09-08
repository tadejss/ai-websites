import type { CSSProperties } from "react";
import type { SiteLookDefinition } from "@/catalog/types";
import { radiusTokensForScale, rhythmToGap } from "@/catalog/archetypes";
import { getCatalogFontPairing } from "@/catalog/fonts";
import { getCatalogPalette } from "@/catalog/palettes";
import { getFontPairing } from "@/theme/fonts/pairings";
import { getLegacyPaletteDefinition, getPalette } from "@/theme/palettes";
import type { SiteTheme } from "@/theme/types";
import { paletteToTokens, tokensToCssVars } from "@/theme/utils/tokens";

/**
 * Resolves look design tokens + colors/fonts.
 * When `themeOverride` is set (from site.json), its palette/fonts/radius win over the look defaults.
 */
export function resolveLookCssVars(
  look: SiteLookDefinition,
  themeOverride?: SiteTheme,
): CSSProperties {
  const paletteId = themeOverride?.paletteId ?? look.theme.paletteId;
  const fontPairingId =
    themeOverride?.fontPairingId ?? look.theme.fontPairingId;

  // Prefer exact catalog/legacy definitions so look + zbrendiraj paths never remapped.
  const palette =
    getCatalogPalette(paletteId) ??
    getLegacyPaletteDefinition(paletteId) ??
    getPalette(paletteId);
  const pairing = fontPairingId
    ? getCatalogFontPairing(fontPairingId) ?? getFontPairing(fontPairingId)
    : undefined;

  if (!palette || !pairing) {
    return {};
  }

  const colorVars = tokensToCssVars(paletteToTokens(palette));
  const tokens = look.designTokens;
  const radius = themeOverride?.radiusScale
    ? radiusTokensForScale(themeOverride.radiusScale)
    : {
        radiusCard: tokens.radiusCard,
        radiusButton: tokens.radiusButton,
        radiusIcon: tokens.radiusIcon,
        galleryRadius: tokens.galleryRadius,
      };

  return {
    ...colorVars,
    "--font-body": `var(${pairing.body.variable})`,
    "--font-display": `var(${pairing.display.variable})`,
    "--radius-card": radius.radiusCard,
    "--radius-button": radius.radiusButton,
    ...(radius.radiusIcon ? { "--radius-icon": radius.radiusIcon } : {}),
    "--shadow-card": tokens.shadowCard ?? "none",
    "--section-gap": rhythmToGap(tokens.sectionRhythm),
    "--heading-tracking": tokens.headingTracking ?? "-0.02em",
    ...(radius.galleryRadius
      ? { "--gallery-radius": radius.galleryRadius }
      : {}),
  } as CSSProperties;
}
