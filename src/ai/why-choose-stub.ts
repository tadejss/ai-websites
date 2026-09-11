import type { SiteConfig } from "@/content/types/site";

/**
 * Schema still requires whyChooseUs for SiteConfig compatibility.
 * If the model omits it, inject this stub so Zod passes.
 * Live templates render whyChooseUs as About (and optional Benefits/Process).
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
