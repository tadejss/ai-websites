import type { SiteConfig } from "@/content/types/site";
import { normalizeGallerySection } from "@/content/apply-new-lead-sections";
import { validateSiteConfig } from "@/content/validate-site-config";
import type { BusinessInput } from "../types";
import { GenerationContentError, toContentError } from "../generation-error";
import { validateClaims } from "../validate-claims";
import { validateCopyVoice } from "../validate-copy-voice";
import { validateGeneratedSiteConfig } from "../validate-generated-site-config";
import { ensureWhyChooseUsForSchema } from "../why-choose-stub";

export const SYSTEM_PROMPT = `You generate SiteConfig JSON for a Slovenian local-business landing page (SMS traffic).

Return ONLY a valid JSON object. No markdown, no code fences, no comments, and no text before or after the JSON.

WRITE LESS (mandatory):
- When information can be communicated in one sentence, do not use two.
- When a label or phrase is sufficient, do not create a sentence.
- Prefer concrete, short, natural Slovenian — like a good local business page, not an agency brochure.

Required top-level keys:
brand, metadata, nav, hero, services, whyChooseUs, contact, footer, pricing

The live page shows: Hero → O nas → Storitve in cene → Galerija? → FAQ → Kontakt.
There is NO separate services section on the page — pricing IS the offer list.
whyChooseUs is used only as the "O nas" content block (not "Zakaj izbrati nas").

Do NOT invent a mission/values/USP agency section.
Do NOT include appearance, theme, templateId, or images — assigned after generation.

Optional: gallery (omit or items: [] — never invent fake photos), sections (usually omit), contact.faq (2–4 short Q&A from real facts only).

Never use null; omit optional fields instead. No extra keys.

Language: Slovenian unless the business input says otherwise.

Icon rules — contact.items[].icon and services.items[].icon MUST be exact IconName strings:
location, phone, email, clock, service-1, service-2, service-3, service-4, service-5, service-6

Nav and section IDs:
- pricing.id = "cenik" (this is the Storitve in cene section)
- contact.id = "kontakt"
- nav.links: #o-nas, #cenik, #kontakt (whyChooseUs powers #o-nas in the UI)
- Do NOT add #zakaj-mi or a separate #storitve nav link

Structure:
- brand: { prefix: string, highlight: string }
- metadata: { title: string, description: string }  (description ≤ 1 short sentence)
- nav: { links: [{ href, label } x3], cta: string }
- hero: { badge: string, title: string, titleHighlight: string, description: string (1 sentence), primaryCta: string, secondaryCta: string, stats: [] }
  hero.stats MUST always be []
- whyChooseUs (rendered as O nas): { id: "zakaj-mi", eyebrow: "O nas", title: short concrete title, description: 1–2 sentences about the business from known facts only, highlights: [3 short concrete points], benefits: [{ title, label, description } x3] matching highlights }
- services: keep 3 short items aligned with pricing names (schema compatibility; not shown as its own section)
- pricing: { id: "cenik", eyebrow: "Storitve in cene", title: "Storitve in cene", description?: string, disclaimer: string, items: [{ name, description?, price, unit?, featured? } x3-6] }
- contact: { id, eyebrow, title, description (≤1 sentence), items: ContactItem[], form: ContactForm, faq?: [{ question, answer } x2-4] }
- footer: { address: string, rights: string }
- footer: { address: string, rights: string }

contact.form must ALWAYS include all nine strings:
title, description, nameLabel, namePlaceholder, phoneLabel, phonePlaceholder, messageLabel, messagePlaceholder, submitLabel

Industry voice:
- beauty / salon / cosmetics: slightly atmospheric, still concrete
- trades (elektro, vodovod, gradnja, auto): practical, what you do / for whom
- cleaning / local services: what the customer actually gets
- professional: clear and restrained

Banned / reject patterns (do not write these):
- "Dobrodošli pri …"
- "Smo več kot …"
- "Zavezani smo kakovosti …"
- "Vaše zadovoljstvo je naša prioriteta"
- "Na enem mestu …"
- "Ponujamo celovite rešitve …"
- stacks like "strokovno, zanesljivo in kakovostno"
- inventing years of experience, awards, certifications, guarantees, review counts, "najboljši/vodilni"
- repeating the business name in every paragraph
- empty marketing adjectives and corporate/agency tone
- unnecessary English terms

Factual accuracy (strict):
- use ONLY facts in the business input
- NEVER invent percentages, experience years, customer counts, awards, certifications, 24/7, services, or official prices
- Prefer omission over invention

Demo pricing section (required top-level "pricing" — this IS the offer list on the page):
- Create 3–6 pricing.items (name + short description + indicative price)
- Prefer "od X €" when exact fee is unknown
- Set pricing.eyebrow/title to "Storitve in cene"
- disclaimer e.g. "Cenik je informativen. Za aktualne cene nas kontaktirajte."
- Never claim prices are the company's official confirmed prices
- services.items should mirror the same offer names (short) for schema compatibility

Map business input:
- phone → contact.items phone with tel: href (do not invent phone/email)
- address → contact location + footer.address
- openingHours → contact clock item when present
- services list → services.items
- callToAction → nav.cta / hero.primaryCta when appropriate
- serviceArea / targetCustomers → brief hero/services wording only when present

Valid examples:
"nav": { "cta": "Pokličite nas", "links": [{"href":"#storitve","label":"Storitve"},{"href":"#kontakt","label":"Kontakt"}] }
"hero": { "primaryCta": "Pokličite", "secondaryCta": "Storitve", "stats": [] }
`;

export function buildUserPrompt(
  input: BusinessInput,
  correction?: string,
): string {
  const prompt = `Generate a SiteConfig JSON object for this business:

${JSON.stringify(input, null, 2)}`;

  if (!correction) {
    return prompt;
  }

  return `${prompt}

Your previous attempt was rejected. Fix exactly these problems and return the corrected JSON:
${correction}`;
}

function stripMarkdownFences(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  if (fenced) {
    return fenced[1].trim();
  }

  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractJsonObject(content: string): string {
  const start = content.indexOf("{");

  if (start === -1) {
    return content;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < content.length; i++) {
    const char = content[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return content.slice(start, i + 1);
      }
    }
  }

  return content.slice(start);
}

function sanitizeJsonResponse(content: string): string {
  const withoutFences = stripMarkdownFences(content);
  return extractJsonObject(withoutFences).trim();
}

export function parseAndValidateSiteConfig(
  content: string,
  providerName: string,
  input: BusinessInput,
): SiteConfig {
  let parsed: unknown;

  try {
    parsed = JSON.parse(sanitizeJsonResponse(content));
  } catch {
    throw new GenerationContentError(
      `${providerName} returned invalid JSON`,
    );
  }

  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    const hadWhyChooseUs =
      record.whyChooseUs !== undefined && record.whyChooseUs !== null;
    ensureWhyChooseUsForSchema(record);

    // New gens must not keep #zakaj-mi; legacy payloads keep their nav for quality bounds.
    if (!hadWhyChooseUs && record.nav && typeof record.nav === "object") {
      const nav = record.nav as { links?: Array<{ href?: string }> };
      if (Array.isArray(nav.links)) {
        nav.links = nav.links.filter((link) => link.href !== "#zakaj-mi");
      }
    }

    if ("gallery" in record) {
      const rawGallery = record.gallery;
      if (rawGallery && typeof rawGallery === "object") {
        record.gallery = normalizeGallerySection(
          rawGallery as Partial<SiteConfig["gallery"]>,
        );
      }
    }

    if ("hero" in record) {
      const hero = record.hero;
      if (hero && typeof hero === "object") {
        (hero as { stats: unknown[] }).stats = [];
      }
    }

    try {
      // All AI generations go through the 2026 template path. whyChooseUs may
      // still be present as "O nas" content — that must not flip us to legacy mode.
      const mode = "template2026" as const;
      const config = validateGeneratedSiteConfig(validateSiteConfig(parsed), {
        mode,
      });

      const withClaims = validateClaims(config, input);

      if (mode === "template2026") {
        const voice = validateCopyVoice(withClaims, input);

        for (const warning of voice.warnings) {
          console.warn(`[copy-voice] ${warning.code}: ${warning.message}`);
        }

        if (!voice.ok) {
          throw new GenerationContentError(
            `Copy voice errors:\n${voice.errors.map((issue) => `- ${issue.message}`).join("\n")}`,
          );
        }
      }

      return withClaims;
    } catch (error) {
      throw toContentError(error);
    }
  }

  throw new GenerationContentError(`${providerName} returned non-object JSON`);
}
