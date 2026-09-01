import type { SiteLookDefinition } from "@/catalog/types";
import { validatePaletteContrast } from "./validate-palette";
import { getCatalogPalette } from "@/catalog/palettes";

export function validateLookContrast(look: SiteLookDefinition): {
  ok: boolean;
  failures: Array<{ pair: string; ratio: number; required: number }>;
} {
  const palette = getCatalogPalette(look.theme.paletteId);
  if (!palette) {
    return {
      ok: false,
      failures: [{ pair: "palette", ratio: 0, required: 1 }],
    };
  }

  return validatePaletteContrast(palette);
}

export function validateLookUniqueness(
  looks: SiteLookDefinition[],
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const comboKeys = new Set<string>();
  const paletteIds = new Set<string>();
  const fontIds = new Set<string>();
  const visualKeys = new Set<string>();

  for (const look of looks) {
    const visualKey = `${look.designTokens.heroStyle}::${look.designTokens.cardTreatment}::${look.designTokens.radiusScale}`;
    if (visualKeys.has(visualKey)) {
      errors.push(`${look.id}: duplicate visual combo ${visualKey}`);
    }
    visualKeys.add(visualKey);

    if (paletteIds.has(look.theme.paletteId)) {
      errors.push(`${look.id}: duplicate paletteId ${look.theme.paletteId}`);
    }
    paletteIds.add(look.theme.paletteId);

    if (fontIds.has(look.theme.fontPairingId)) {
      errors.push(`${look.id}: duplicate fontPairingId ${look.theme.fontPairingId}`);
    }
    fontIds.add(look.theme.fontPairingId);

    const combo = `${look.theme.paletteId}::${look.theme.fontPairingId}`;
    if (comboKeys.has(combo)) {
      errors.push(`${look.id}: duplicate theme combo`);
    }
    comboKeys.add(combo);
  }

  return { ok: errors.length === 0, errors };
}
