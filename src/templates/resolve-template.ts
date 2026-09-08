import type { SiteConfig } from "@/content/types/site";
import { templateFromLegacyAppearance } from "./category-template-profile";
import { isTemplateId, type TemplateId } from "./types";

/**
 * Prefer explicit templateId; otherwise map legacy appearance/look demos.
 * zbrendiraj stays on the marketing appearance path (caller should check).
 */
export function resolveTemplateId(siteConfig: SiteConfig): TemplateId {
  if (isTemplateId(siteConfig.templateId)) {
    return siteConfig.templateId;
  }
  return templateFromLegacyAppearance(siteConfig.appearance);
}
