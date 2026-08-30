import type { PricingItem, PricingSectionConfig } from "./types/site";

/**
 * Future factory helper: replace demo pricing wholesale with customer-approved data.
 * Keeps the same PricingSectionConfig shape so onboarding can overwrite site.json pricing.
 */
export function replacePricingSection(
  existing: PricingSectionConfig | undefined,
  next: {
    items: PricingItem[];
    title?: string;
    eyebrow?: string;
    description?: string;
    disclaimer?: string;
    id?: string;
  },
): PricingSectionConfig {
  return {
    id: next.id ?? existing?.id ?? "cenik",
    eyebrow: next.eyebrow ?? existing?.eyebrow ?? "Cenik",
    title: next.title ?? existing?.title ?? "Pregledne cene",
    description: next.description ?? existing?.description,
    disclaimer:
      next.disclaimer ??
      existing?.disclaimer ??
      "Cenik je informativen. Za aktualne cene nas kontaktirajte.",
    items: next.items,
  };
}
