import type {
  LookCardTreatment,
  LookDesignTokens,
  LookHeroStyle,
  LookRadiusScale,
  LookSectionRhythm,
} from "@/catalog/types";

export type LookArchetype = {
  suffix: string;
  displaySuffix: string;
  heroStyle: LookHeroStyle;
  cardTreatment: LookCardTreatment;
  radiusScale: LookRadiusScale;
  sectionRhythm: LookSectionRhythm;
  description: string;
  preferDark?: boolean;
};

export const LOOK_ARCHETYPES: LookArchetype[] = [
  {
    suffix: "classic-split",
    displaySuffix: "Klasičen split",
    heroStyle: "split-image",
    cardTreatment: "bordered",
    radiusScale: "soft",
    sectionRhythm: "balanced",
    description: "Klasičen split hero, kartice z border",
  },
  {
    suffix: "editorial-type",
    displaySuffix: "Uredniški tipografski",
    heroStyle: "typographic",
    cardTreatment: "none",
    radiusScale: "sharp",
    sectionRhythm: "editorial",
    description: "Tipografija v ospredju, brez kartic",
  },
  {
    suffix: "photo-forward",
    displaySuffix: "Foto v ospredju",
    heroStyle: "photo-dominant",
    cardTreatment: "flat",
    radiusScale: "round",
    sectionRhythm: "airy",
    description: "Velika fotografija, minimalni UI",
  },
  {
    suffix: "stats-trust",
    displaySuffix: "Statistike in zaupanje",
    heroStyle: "stats-forward",
    cardTreatment: "elevated",
    radiusScale: "soft",
    sectionRhythm: "compact",
    description: "Številke/statistike, zaupanje",
  },
  {
    suffix: "minimal-line",
    displaySuffix: "Minimalne črte",
    heroStyle: "minimal",
    cardTreatment: "outlined",
    radiusScale: "sharp",
    sectionRhythm: "airy",
    description: "Tanke črte, veliko whitespace",
  },
  {
    suffix: "service-grid",
    displaySuffix: "Mreža storitev",
    heroStyle: "service-first",
    cardTreatment: "bordered",
    radiusScale: "soft",
    sectionRhythm: "balanced",
    description: "Storitve v gridu, hero krajši",
  },
  {
    suffix: "asymmetric-bold",
    displaySuffix: "Asimetričen bold",
    heroStyle: "asymmetric",
    cardTreatment: "flat",
    radiusScale: "round",
    sectionRhythm: "editorial",
    description: "Asimetričen layout, bold accent",
  },
  {
    suffix: "dark-pro",
    displaySuffix: "Temni profesionalen",
    heroStyle: "split-image",
    cardTreatment: "flat",
    radiusScale: "soft",
    sectionRhythm: "compact",
    description: "Profesionalen, kompakten (dark za trade)",
    preferDark: true,
  },
  {
    suffix: "warm-soft",
    displaySuffix: "Topel mehek",
    heroStyle: "stacked",
    cardTreatment: "elevated",
    radiusScale: "pill",
    sectionRhythm: "airy",
    description: "Mehke sence, pill gumbi",
  },
  {
    suffix: "industrial-plain",
    displaySuffix: "Industrijski preprost",
    heroStyle: "minimal",
    cardTreatment: "none",
    radiusScale: "sharp",
    sectionRhythm: "compact",
    description: "Brez kartic, industrijski",
  },
];

const RADIUS_VALUES: Record<LookRadiusScale, string> = {
  sharp: "0.5rem",
  soft: "1rem",
  round: "1.5rem",
  pill: "2rem",
};

const SHADOW_VALUES: Record<LookCardTreatment, string | undefined> = {
  none: "none",
  flat: "none",
  bordered: "none",
  outlined: "none",
  elevated: "0 8px 24px rgba(0,0,0,0.08)",
};

const RHYTHM_GAP: Record<LookSectionRhythm, string> = {
  compact: "4rem",
  balanced: "6rem",
  airy: "8rem",
  editorial: "7rem",
};

const TRACKING: Record<LookSectionRhythm, string> = {
  compact: "-0.01em",
  balanced: "-0.02em",
  airy: "-0.03em",
  editorial: "-0.025em",
};

export function archetypeToDesignTokens(archetype: LookArchetype): LookDesignTokens {
  return {
    radiusScale: archetype.radiusScale,
    radiusCard: RADIUS_VALUES[archetype.radiusScale],
    cardTreatment: archetype.cardTreatment,
    sectionRhythm: archetype.sectionRhythm,
    heroStyle: archetype.heroStyle,
    useSectionRules: archetype.sectionRhythm !== "airy",
    galleryRadius: RADIUS_VALUES[archetype.radiusScale],
    shadowCard: SHADOW_VALUES[archetype.cardTreatment],
    headingTracking: TRACKING[archetype.sectionRhythm],
  };
}

export function rhythmToGap(rhythm: LookSectionRhythm): string {
  return RHYTHM_GAP[rhythm];
}
