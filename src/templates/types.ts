export const TEMPLATE_IDS = ["bento", "outlined", "type", "floating", "mono"] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export function isTemplateId(value: string | undefined | null): value is TemplateId {
  return (
    typeof value === "string" &&
    (TEMPLATE_IDS as readonly string[]).includes(value)
  );
}

export type TemplateImageRole =
  | "hero-block"
  | "hero-overlap"
  | "hero-editorial"
  | "hero-type-band"
  | "service-thumb"
  | "service-none"
  | "editorial-float";

export type TemplateImagePlan = {
  heroRole: TemplateImageRole;
  serviceRole: "service-thumb" | "service-none";
  preferPortraitHero: boolean;
};

export type TemplateProfile = {
  allowed: TemplateId[];
  preferred: TemplateId[];
  imageHeavy: boolean;
  typographyHeavy: boolean;
};

export type TemplatePageProps = {
  siteConfig: import("@/content/types/site").SiteConfig;
  siteSlug: string;
};

export type TemplateDefinition = {
  id: TemplateId;
  Page: React.ComponentType<TemplatePageProps>;
  stickyPhoneBar: boolean;
  imagePlan: TemplateImagePlan;
  /** Beauty categories may enable serif display inside Floating. */
  beautySerif?: boolean;
};
