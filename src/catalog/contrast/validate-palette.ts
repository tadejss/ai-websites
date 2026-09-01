import type { Palette } from "@/theme/types";
import { contrastRatio } from "@/theme/utils/color";
import { paletteToTokens } from "@/theme/utils/tokens";

export type ContrastFailure = {
  pair: string;
  ratio: number;
  required: number;
};

export function validatePaletteContrast(palette: Palette): {
  ok: boolean;
  failures: ContrastFailure[];
} {
  const tokens = paletteToTokens(palette);
  const checks: Array<{ pair: string; fg: string; bg: string; required: number }> =
    [
      {
        pair: "foreground/background",
        fg: tokens.foreground,
        bg: tokens.background,
        required: 4.5,
      },
      {
        pair: "muted/background",
        fg: tokens.muted,
        bg: tokens.background,
        required: 4.5,
      },
      {
        pair: "accentForeground/accent",
        fg: tokens.accentForeground,
        bg: tokens.accent,
        required: 4.5,
      },
      {
        pair: "accent/background",
        fg: tokens.accent,
        bg: tokens.background,
        required: 3,
      },
      {
        pair: "foreground/surface",
        fg: tokens.foreground,
        bg: tokens.surface,
        required: 4.5,
      },
    ];

  const failures: ContrastFailure[] = [];

  for (const check of checks) {
    const ratio = contrastRatio(check.fg, check.bg);
    if (ratio < check.required) {
      failures.push({
        pair: check.pair,
        ratio: Math.round(ratio * 100) / 100,
        required: check.required,
      });
    }
  }

  return { ok: failures.length === 0, failures };
}
