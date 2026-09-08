import type { CSSProperties } from "react";
import type { Palette } from "@/theme/types";
import { paletteToTokens } from "@/theme/utils/tokens";
import { applyTemplatePaletteRules } from "./palette-rules";
import type { TemplateId } from "./types";

/** Structure-only tokens — fonts, radius. Colors come from the resolved palette. */
export type TemplateStructureTokens = {
  radius: string;
  fontBody: string;
  fontDisplay: string;
};

/** @deprecated Prefer TemplateStructureTokens + palette merge. Kept for smoke tests. */
export type TemplateTokens = TemplateStructureTokens & {
  background: string;
  foreground: string;
  accent: string;
  surface: string;
  border: string;
  muted: string;
};

const STRUCTURE: Record<TemplateId, TemplateStructureTokens> = {
  bento: {
    radius: "14px",
    fontBody: "var(--font-outfit), ui-sans-serif, system-ui, sans-serif",
    fontDisplay: "var(--font-outfit), ui-sans-serif, system-ui, sans-serif",
  },
  outlined: {
    radius: "4px",
    fontBody: "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif",
    fontDisplay: "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif",
  },
  type: {
    radius: "0px",
    fontBody: "var(--font-archivo), ui-sans-serif, system-ui, sans-serif",
    fontDisplay: "var(--font-archivo), ui-sans-serif, system-ui, sans-serif",
  },
  floating: {
    radius: "24px",
    fontBody: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif",
    fontDisplay: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif",
  },
};

export function resolveTemplateStructure(
  templateId: TemplateId,
): TemplateStructureTokens {
  return STRUCTURE[templateId];
}

/** @deprecated Use resolveTemplateStructure + mergeTemplatePaletteCssVars. */
export function resolveTemplateTokens(
  templateId: TemplateId,
  _options?: { beautySerif?: boolean },
): TemplateTokens {
  const structure = STRUCTURE[templateId];
  // Fallback colors only when callers do not merge a palette (legacy smoke).
  const fallback: Record<TemplateId, Omit<TemplateTokens, keyof TemplateStructureTokens>> = {
    bento: {
      background: "#0f1419",
      foreground: "#f4f7fb",
      accent: "#3dff9a",
      surface: "#1a222c",
      border: "#2a3542",
      muted: "#9aa8b8",
    },
    outlined: {
      background: "#fff8f0",
      foreground: "#111111",
      accent: "#ff3d7f",
      surface: "#ffffff",
      border: "#111111",
      muted: "#6e6e6e",
    },
    type: {
      background: "#f7f7f5",
      foreground: "#0a0a0a",
      accent: "#0a0a0a",
      surface: "#f7f7f5",
      border: "#0a0a0a",
      muted: "#6a6a6a",
    },
    floating: {
      background: "#f3efe8",
      foreground: "#161410",
      accent: "#8b3a2a",
      surface: "#faf7f2",
      border: "#d9d0c4",
      muted: "#716a60",
    },
  };
  return { ...structure, ...fallback[templateId] };
}

export function mergeTemplatePaletteCssVars(
  structure: TemplateStructureTokens,
  palette: Palette,
  templateId?: TemplateId,
): CSSProperties {
  const presented = templateId
    ? applyTemplatePaletteRules(palette, templateId)
    : palette;
  const color = paletteToTokens(presented);
  return {
    ["--background" as string]: color.background,
    ["--foreground" as string]: color.foreground,
    ["--accent" as string]: color.accent,
    ["--primary" as string]: color.accent,
    ["--accent-hover" as string]: color.accentHover,
    ["--accent-foreground" as string]: color.accentForeground,
    ["--surface" as string]: color.surface,
    ["--surface-elevated" as string]: color.surfaceElevated,
    ["--border" as string]: color.border,
    ["--muted" as string]: color.muted,
    ["--radius-card" as string]: color.radiusCard,
    ["--radius" as string]: structure.radius,
    ["--font-body" as string]: structure.fontBody,
    ["--font-display" as string]: structure.fontDisplay,
    backgroundColor: color.background,
    color: color.foreground,
    fontFamily: structure.fontBody,
  };
}

/** @deprecated Prefer mergeTemplatePaletteCssVars. */
export function templateTokensToCssVars(tokens: TemplateTokens): CSSProperties {
  return {
    ["--background" as string]: tokens.background,
    ["--foreground" as string]: tokens.foreground,
    ["--accent" as string]: tokens.accent,
    ["--surface" as string]: tokens.surface,
    ["--border" as string]: tokens.border,
    ["--muted" as string]: tokens.muted,
    ["--radius" as string]: tokens.radius,
    ["--font-body" as string]: tokens.fontBody,
    ["--font-display" as string]: tokens.fontDisplay,
    backgroundColor: tokens.background,
    color: tokens.foreground,
    fontFamily: tokens.fontBody,
  };
}
