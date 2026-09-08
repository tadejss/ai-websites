import type { SiteConfig } from "@/content/types/site";

/**
 * Schema still requires whyChooseUs for legacy SiteConfig compatibility.
 * New AI generation omits it; we inject this stub so Zod passes.
 * New templates never render whyChooseUs.
 */
export const SCHEMA_WHY_CHOOSE_STUB: SiteConfig["whyChooseUs"] = {
  id: "zakaj-mi",
  eyebrow: "O nas",
  title: "Lokalna storitev",
  description: "Po dogovoru.",
  highlights: ["Termin po dogovoru", "Jasna ponudba", "Odgovor po telefonu"],
  benefits: [
    {
      title: "Termin",
      label: "Termin",
      description: "Po dogovoru.",
    },
    {
      title: "Ponudba",
      label: "Ponudba",
      description: "Po dogovoru.",
    },
    {
      title: "Kontakt",
      label: "Kontakt",
      description: "Po telefonu.",
    },
  ],
};

export function ensureWhyChooseUsForSchema(
  parsed: Record<string, unknown>,
): void {
  const existing = parsed.whyChooseUs;
  if (!existing || typeof existing !== "object") {
    parsed.whyChooseUs = SCHEMA_WHY_CHOOSE_STUB;
  }
}
