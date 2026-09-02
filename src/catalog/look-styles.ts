import type { LookDesignTokens } from "@/catalog/types";
import { rhythmToGap } from "@/catalog/archetypes";

export const BUTTON_RADIUS_CLASS = "rounded-[var(--radius-button,9999px)]";
export const ICON_RADIUS_CLASS = "rounded-[var(--radius-icon,9999px)]";

export function buttonRadiusClass(): string {
  return BUTTON_RADIUS_CLASS;
}

export function cardClassForLook(tokens: LookDesignTokens): string {
  const radius = "rounded-[var(--radius-card)]";
  const shadow =
    tokens.shadowCard && tokens.shadowCard !== "none"
      ? "shadow-[var(--shadow-card)]"
      : "";

  switch (tokens.cardTreatment) {
    case "none":
      return "border-0 bg-transparent p-0 shadow-none";
    case "flat":
      return `${radius} bg-surface p-6 ${shadow}`.trim();
    case "bordered":
      return `${radius} border border-border bg-surface p-6 ${shadow}`.trim();
    case "outlined":
      return `${radius} border border-border bg-transparent p-6 ${shadow}`.trim();
    case "elevated":
      return `${radius} border border-border/50 bg-surface-elevated p-6 ${shadow}`.trim();
    default:
      return `${radius} bg-surface p-6`;
  }
}

export function iconWellClassForLook(tokens: LookDesignTokens): string {
  if (tokens.radiusScale === "pill") {
    return "rounded-full";
  }
  return ICON_RADIUS_CLASS;
}

export function heroLayoutClassForLook(tokens: LookDesignTokens): string {
  switch (tokens.heroStyle) {
    case "typographic":
      return "max-w-4xl";
    case "photo-dominant":
    case "full-bleed":
      return "relative min-h-[70vh]";
    case "stats-forward":
      return "max-w-5xl";
    case "minimal":
      return "max-w-2xl";
    case "asymmetric":
      return "max-w-6xl";
    case "stacked":
      return "max-w-3xl mx-auto text-center";
    case "service-first":
      return "max-w-3xl";
    case "editorial-grid":
      return "max-w-6xl";
    default:
      return "max-w-7xl";
  }
}

export function sectionSpacingForLook(tokens: LookDesignTokens): string {
  switch (tokens.sectionRhythm) {
    case "compact":
      return "py-16 sm:py-20";
    case "airy":
      return "py-28 sm:py-36";
    case "editorial":
      return "py-24 sm:py-32";
    default:
      return "py-20 sm:py-28";
  }
}

export function heroStyleFlags(tokens: LookDesignTokens) {
  return {
    isTypographic: tokens.heroStyle === "typographic",
    isPhotoDominant:
      tokens.heroStyle === "photo-dominant" || tokens.heroStyle === "full-bleed",
    isStatsForward: tokens.heroStyle === "stats-forward",
    isMinimal: tokens.heroStyle === "minimal",
    isStacked: tokens.heroStyle === "stacked",
    isAsymmetric: tokens.heroStyle === "asymmetric",
    isServiceFirst: tokens.heroStyle === "service-first",
    useAccentHeroCard:
      tokens.heroStyle === "split-image" || tokens.heroStyle === "stacked",
    noCards: tokens.cardTreatment === "none",
    sectionGap: rhythmToGap(tokens.sectionRhythm),
  };
}
