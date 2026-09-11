import { BentoPage } from "./bento/BentoPage";
import { FloatingPage } from "./floating/FloatingPage";
import { OutlinedPage } from "./outlined/OutlinedPage";
import { TypePage } from "./type-minimal/TypePage";
import { MonoPage } from "./mono/MonoPage";
import { getTemplateImagePlan } from "./image-plan";
import type { TemplateDefinition, TemplateId } from "./types";

export const templateRegistry = {
  bento: {
    id: "bento",
    Page: BentoPage,
    stickyPhoneBar: false,
    imagePlan: getTemplateImagePlan("bento"),
  },
  outlined: {
    id: "outlined",
    Page: OutlinedPage,
    stickyPhoneBar: false,
    imagePlan: getTemplateImagePlan("outlined"),
  },
  type: {
    id: "type",
    Page: TypePage,
    stickyPhoneBar: false,
    imagePlan: getTemplateImagePlan("type"),
  },
  floating: {
    id: "floating",
    Page: FloatingPage,
    stickyPhoneBar: false,
    imagePlan: getTemplateImagePlan("floating"),
  },
  mono: {
    id: "mono",
    Page: MonoPage,
    stickyPhoneBar: false,
    imagePlan: getTemplateImagePlan("mono"),
  },
} satisfies Record<TemplateId, TemplateDefinition>;
