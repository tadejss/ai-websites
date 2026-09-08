export type { TemplateId, TemplateProfile, TemplateImagePlan } from "./types";
export { TEMPLATE_IDS, isTemplateId } from "./types";
export { resolveTemplateId } from "./resolve-template";
export { assignTemplate } from "./assign-template";
export { assignPalette, suitabilityTagsFor } from "./assign-palette";
export { templateProfile } from "./category-template-profile";
export { templateRegistry } from "./registry";
export { getTemplateImagePlan } from "./image-plan";
export {
  resolveTemplateStructure,
  resolveTemplateTokens,
  mergeTemplatePaletteCssVars,
  templateTokensToCssVars,
} from "./tokens";
export {
  applyTemplatePaletteRules,
  TEMPLATE_PALETTE_RULES,
} from "./palette-rules";
export { templateFontClassName } from "./fonts";
