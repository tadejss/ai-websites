import type { Palette, ThemeMode, ThemeTokens } from "@/theme/types";
import type { TemplateId } from "./types";

/**
 * Per-template presentation overrides for curated palettes.
 *
 * Base tokens in `curated.ts` stay shared. Each template can enforce
 * card-vs-page separation (bento cards sit on `--surface` over `--background`).
 *
 * Bento rule (2026 QA): light pages need a tinted wash at least as strong as
 * citrus-ink / clay-ember; dark pages need a surface lift at least as clear as
 * obsidian-lime. Palettes already meeting that (citrus-ink, clay-ember,
 * obsidian-lime) have no override.
 *
 * Outlined rule (2026 QA): same wash strength so white frames separate from
 * the page; borders a touch stronger (2px frames). Advantage 01/02/03 cells
 * fill mid-mix of `--background` and `--surface`.
 *
 * Type rule (2026 QA): cobalt-cream + olive-ink invert so brand color is the
 * page background (cream text/accent).
 */
export type TemplatePalettePresentation = Partial<ThemeTokens> & {
  mode?: ThemeMode;
};

export const TEMPLATE_PALETTE_RULES: Partial<
  Record<TemplateId, Partial<Record<string, TemplatePalettePresentation>>>
> = {
  bento: {
    // 1 ink-coral — warm coral wash vs white cards
    "ink-coral": {
      background: "#EDE0DC",
      surface: "#FFFFFF",
      border: "rgba(10, 10, 10, 0.16)",
    },
    // 2 cobalt-cream
    "cobalt-cream": {
      background: "#DDE4F5",
      surface: "#FFFFFF",
      border: "rgba(11, 18, 32, 0.16)",
    },
    // 3 forest-signal
    "forest-signal": {
      background: "#DCE8E0",
      surface: "#FFFFFF",
      border: "rgba(12, 18, 16, 0.16)",
    },
    // 6 electric-navy
    "electric-navy": {
      background: "#DCE4F4",
      surface: "#FFFFFF",
      border: "rgba(7, 16, 31, 0.16)",
    },
    // 7 burgundy-cream — deepen page, lift cards
    "burgundy-cream": {
      background: "#5C1730",
      surface: "#9A3A58",
      surfaceElevated: "#A84464",
      border: "rgba(251, 247, 244, 0.24)",
    },
    // 8 deep-plum
    "deep-plum": {
      background: "#ECDFE8",
      surface: "#FFFFFF",
      border: "rgba(18, 8, 20, 0.16)",
    },
    // 9 olive-ink
    "olive-ink": {
      background: "#E6E0D2",
      surface: "#FFFFFF",
      border: "rgba(18, 20, 14, 0.16)",
    },
    // 10 charcoal-signal
    "charcoal-signal": {
      background: "#E4E2DC",
      surface: "#FFFFFF",
      border: "rgba(10, 10, 10, 0.18)",
    },
    // 12 warm-black
    "warm-black": {
      background: "#0A0807",
      surface: "#2E241C",
      surfaceElevated: "#3A2E24",
      border: "rgba(247, 241, 234, 0.16)",
    },
    // 13 midnight-cobalt — deepen page, lift cards; keep FG AA on surface
    "midnight-cobalt": {
      background: "#1632A0",
      surface: "#3A5AD8",
      surfaceElevated: "#4568E8",
      border: "rgba(238, 242, 255, 0.24)",
    },
    // 14 charcoal-gold
    "charcoal-gold": {
      background: "#080808",
      surface: "#282828",
      surfaceElevated: "#323232",
      border: "rgba(245, 245, 244, 0.16)",
    },
  },
  outlined: {
    // 1 ink-coral
    "ink-coral": {
      background: "#EDE0DC",
      surface: "#FFFFFF",
      border: "rgba(10, 10, 10, 0.28)",
    },
    // 2 cobalt-cream
    "cobalt-cream": {
      background: "#DDE4F5",
      surface: "#FFFFFF",
      border: "rgba(11, 18, 32, 0.28)",
    },
    // 3 forest-signal
    "forest-signal": {
      background: "#DCE8E0",
      surface: "#FFFFFF",
      border: "rgba(12, 18, 16, 0.28)",
    },
    // 6 electric-navy
    "electric-navy": {
      background: "#DCE4F4",
      surface: "#FFFFFF",
      border: "rgba(7, 16, 31, 0.28)",
    },
    // 7 burgundy-cream
    "burgundy-cream": {
      background: "#5C1730",
      surface: "#9A3A58",
      surfaceElevated: "#A84464",
      border: "rgba(251, 247, 244, 0.32)",
    },
    // 8 deep-plum
    "deep-plum": {
      background: "#ECDFE8",
      surface: "#FFFFFF",
      border: "rgba(18, 8, 20, 0.28)",
    },
    // 9 olive-ink
    "olive-ink": {
      background: "#E6E0D2",
      surface: "#FFFFFF",
      border: "rgba(18, 20, 14, 0.28)",
    },
    // 10 charcoal-signal
    "charcoal-signal": {
      background: "#E4E2DC",
      surface: "#FFFFFF",
      border: "rgba(10, 10, 10, 0.30)",
    },
    // 12 warm-black
    "warm-black": {
      background: "#0A0807",
      surface: "#2E241C",
      surfaceElevated: "#3A2E24",
      border: "rgba(247, 241, 234, 0.28)",
    },
    // 13 midnight-cobalt
    "midnight-cobalt": {
      background: "#1632A0",
      surface: "#3A5AD8",
      surfaceElevated: "#4568E8",
      border: "rgba(238, 242, 255, 0.32)",
    },
  },
  type: {
    // 2 cobalt-cream — cobalt as page, cream type/accent
    "cobalt-cream": {
      mode: "dark",
      background: "#163EB8",
      surface: "#2A58E0",
      surfaceElevated: "#3564EA",
      foreground: "#F7F8FC",
      muted: "#C5CEF0",
      accent: "#F7F8FC",
      accentHover: "#FFFFFF",
      accentForeground: "#163EB8",
      border: "rgba(247, 248, 252, 0.28)",
    },
    // 9 olive-ink — olive as page, cream type/accent
    "olive-ink": {
      mode: "dark",
      background: "#3A4A1A",
      surface: "#4F6428",
      surfaceElevated: "#5A7030",
      foreground: "#F7F5EF",
      muted: "#D4D0C4",
      accent: "#F7F5EF",
      accentHover: "#FFFFFF",
      accentForeground: "#3A4A1A",
      border: "rgba(247, 245, 239, 0.28)",
    },
  },
  // floating — fill when QA'd
};

export function applyTemplatePaletteRules(
  palette: Palette,
  templateId: TemplateId,
): Palette {
  const override = TEMPLATE_PALETTE_RULES[templateId]?.[palette.id];
  if (!override) return palette;

  const { mode, ...tokenOverride } = override;
  const background = tokenOverride.background ?? palette.swatches[0];
  const surface = tokenOverride.surface ?? palette.swatches[1];
  const accent = tokenOverride.accent ?? palette.swatches[2];
  const muted = tokenOverride.muted ?? palette.swatches[3];
  const foreground = tokenOverride.foreground ?? palette.swatches[4];

  return {
    ...palette,
    mode: mode ?? palette.mode,
    swatches: [background, surface, accent, muted, foreground],
    tokens: {
      ...palette.tokens,
      ...tokenOverride,
    },
  };
}
