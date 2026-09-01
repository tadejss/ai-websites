import type { ImagePoolCategoryId } from "@/images/image-pool-category";
import type { AppearanceId, SiteLayout, SiteTheme } from "@/content/types/site";

export type SiteLookId = `${ImagePoolCategoryId}-${string}`;

export type LookRadiusScale = "sharp" | "soft" | "round" | "pill";
export type LookCardTreatment = "none" | "flat" | "bordered" | "elevated" | "outlined";
export type LookSectionRhythm = "compact" | "balanced" | "airy" | "editorial";
export type LookHeroStyle =
  | "split-image"
  | "full-bleed"
  | "typographic"
  | "stats-forward"
  | "stacked"
  | "asymmetric"
  | "minimal"
  | "editorial-grid"
  | "photo-dominant"
  | "service-first";

export type LookDesignTokens = {
  radiusScale: LookRadiusScale;
  radiusCard: string;
  cardTreatment: LookCardTreatment;
  sectionRhythm: LookSectionRhythm;
  heroStyle: LookHeroStyle;
  useSectionRules: boolean;
  galleryRadius?: string;
  shadowCard?: string;
  headingTracking?: string;
};

export type SiteLookDefinition = {
  id: SiteLookId;
  categoryId: ImagePoolCategoryId;
  displayName: string;
  description: string;
  appearance: AppearanceId;
  theme: SiteTheme;
  layout: SiteLayout;
  designTokens: LookDesignTokens;
  contrastMin: {
    body: 4.5;
    largeText: 3;
    ui: 3;
  };
  status: "approved" | "draft" | "deprecated";
  preview?: {
    thumbnailPath?: string;
  };
};
