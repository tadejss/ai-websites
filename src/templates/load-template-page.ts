import type { ComponentType } from "react";
import type { SiteConfig } from "@/content/types/site";
import type { TemplateId } from "@/templates/types";

type TemplatePageProps = { siteConfig: SiteConfig; siteSlug: string };

export type LoadedTemplate = {
  Page: ComponentType<TemplatePageProps>;
};

/**
 * Load only the selected template implementation.
 * Explicit switch + per-id import() so the server graph can split by template.
 */
export async function loadTemplatePage(
  templateId: TemplateId,
): Promise<LoadedTemplate> {
  switch (templateId) {
    case "bento": {
      const { BentoPage } = await import("@/templates/bento/BentoPage");
      return { Page: BentoPage };
    }
    case "outlined": {
      const { OutlinedPage } = await import(
        "@/templates/outlined/OutlinedPage"
      );
      return { Page: OutlinedPage };
    }
    case "type": {
      const { TypePage } = await import("@/templates/type-minimal/TypePage");
      return { Page: TypePage };
    }
    case "floating": {
      const { FloatingPage } = await import(
        "@/templates/floating/FloatingPage"
      );
      return { Page: FloatingPage };
    }
    default: {
      const { BentoPage } = await import("@/templates/bento/BentoPage");
      return { Page: BentoPage };
    }
  }
}
