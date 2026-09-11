import type { TemplateId, TemplateImagePlan } from "./types";

export const TEMPLATE_IMAGE_PLANS: Record<TemplateId, TemplateImagePlan> = {
  bento: {
    heroRole: "hero-block",
    serviceRole: "service-thumb",
    preferPortraitHero: false,
  },
  outlined: {
    heroRole: "hero-overlap",
    serviceRole: "service-thumb",
    preferPortraitHero: false,
  },
  type: {
    heroRole: "hero-type-band",
    serviceRole: "service-none",
    preferPortraitHero: true,
  },
  floating: {
    heroRole: "hero-editorial",
    serviceRole: "service-none",
    preferPortraitHero: true,
  },
  mono: {
    heroRole: "hero-editorial",
    serviceRole: "service-thumb",
    preferPortraitHero: false,
  },
};

export function getTemplateImagePlan(templateId: TemplateId): TemplateImagePlan {
  return TEMPLATE_IMAGE_PLANS[templateId];
}
