import type { SiteConfig } from "@/content/types/site";
import { validateSiteConfig } from "@/content/validate-site-config";
import type { BusinessInput } from "../types";
import { GenerationContentError, toContentError } from "../generation-error";
import { validateClaims } from "../validate-claims";
import { validateGeneratedSiteConfig } from "../validate-generated-site-config";

export const SYSTEM_PROMPT = `You generate SiteConfig JSON for a local business website.

Return ONLY a valid JSON object. No markdown, no code fences, no comments, and no text before or after the JSON.

Every field and value MUST match the SiteConfig schema exactly:
- use the correct JSON types for every field
- include every required field
- do not add extra keys at any level
- do not invent extra nesting or wrapper objects
- never use null; omit optional fields instead

Required top-level keys (exactly these eight):
brand, metadata, nav, hero, services, whyChooseUs, contact, footer

Do not include an appearance field — it is assigned automatically after generation based on industry.
Do not include a theme field — palette and font pairing are assigned automatically after generation.
Do not include an images field — images are assigned automatically after generation.

Write all visible text in Slovenian unless the business input specifies another language.

Icon rules — contact.items[].icon and services.items[].icon must use ONLY these exact IconName strings:
location, phone, email, clock, service-1, service-2, service-3, service-4, service-5, service-6

Nav and section ID rules:
- services.id = "storitve", nav href "#storitve"
- whyChooseUs.id = "zakaj-mi", nav href "#zakaj-mi"
- contact.id = "kontakt", nav href "#kontakt"

Structure requirements:
- brand: { prefix: string, highlight: string }
- metadata: { title: string, description: string }
- nav: { links: [{ href: string, label: string } x3], cta: string }
- hero: { badge: string, title: string, titleHighlight: string, description: string, primaryCta: string, secondaryCta: string, stats: [{ value: string, label: string } exactly 4] }
- services: { id: string, eyebrow: string, title: string, description: string, items: [{ title: string, description: string, icon: IconName } x4-6] }
- whyChooseUs: { id: string, eyebrow: string, title: string, description: string, highlights: [string x3-4], benefits: [{ title: string, label: string, description: string, stat?: string } x3] }
- contact: { id: string, eyebrow: string, title: string, description: string, items: ContactItem[], form: ContactForm }
- footer: { address: string, rights: string }

contact.form must ALWAYS include all nine required string fields:
title, description, nameLabel, namePlaceholder, phoneLabel, phonePlaceholder, messageLabel, messagePlaceholder, submitLabel

Valid vs invalid examples:

INVALID:
"nav": { "cta": { "label": "Rezerviraj", "href": "#kontakt" } }
VALID:
"nav": { "cta": "Rezerviraj termin" }

INVALID:
"hero": { "primaryCta": { "text": "Kontakt" }, "secondaryCta": { "text": "Storitve" } }
VALID:
"hero": { "primaryCta": "Rezerviraj termin", "secondaryCta": "Naše storitve" }

INVALID:
"contact": { "items": [{ "label": "Telefon", "value": "+386 1 234 56 78", "icon": "phone-icon" }] }
VALID:
"contact": { "items": [{ "label": "Telefon", "value": "+386 1 234 56 78", "href": "tel:+38612345678", "icon": "phone" }] }

INVALID:
"contact": { "items": [{ "label": "Naslov", "value": "Ulica 1", "icon": "location", "href": null }] }
VALID:
"contact": { "items": [{ "label": "Naslov", "value": "Ulica 1", "icon": "location" }] }

INVALID:
"contact": { "form": { "title": "Kontakt", "submitLabel": "Pošlji" } }
VALID:
"contact": { "form": { "title": "Pošljite povpraševanje", "description": "...", "nameLabel": "...", "namePlaceholder": "...", "phoneLabel": "...", "phonePlaceholder": "...", "messageLabel": "...", "messagePlaceholder": "...", "submitLabel": "Pošlji povpraševanje" } }

Business input fields:
The user message contains a JSON business input. Use every provided field to write specific copy. Optional fields may include:
targetCustomers, serviceArea, yearsExperience, tone, brandStyle, competitors, callToAction

When these fields are provided, apply them as follows:
- targetCustomers → shape hero.description and whyChooseUs copy toward the intended audience
- serviceArea → reference the local area in hero copy, metadata.description, and services.description where relevant
- yearsExperience → use in hero.stats and whyChooseUs.benefits ONLY when it is a non-empty value; when it is empty, never substitute an invented number
- tone → apply consistently across all visible text
- brandStyle → reflect in hero copy, section titles, and overall wording style
- competitors → use subtly in whyChooseUs.highlights and benefits to differentiate without naming competitors directly unless provided
- callToAction → use for nav.cta, hero.primaryCta, and contact.form.submitLabel when appropriate

Field mapping summary:
- hero copy: targetCustomers, serviceArea, tone, brandStyle
- whyChooseUs.benefits and highlights: yearsExperience, competitors, sellingPoints, targetCustomers
- services.items[].description and services.description: services list, serviceArea, targetCustomers
- CTA texts: callToAction for nav.cta, hero.primaryCta, contact.form.submitLabel
- metadata.description: tagline, industry, targetCustomers, serviceArea, tone

Factual accuracy rules (strict):
- use ONLY facts present in the business input; this website will be shown to the real business owner
- NEVER invent percentages; "100%", "98%" and similar are forbidden unless the number appears in the business input
- NEVER invent years of experience, founding dates or company history
- NEVER invent customer, client, project or review counts such as "500+ strank"
- NEVER invent awards, certifications, guarantees, prices or partnerships
- NEVER claim 24/7 or non-stop availability unless openingHours says so
- NEVER invent services that are not in the business input

hero.stats and whyChooseUs.benefits[].stat do NOT have to be numbers. When there is no supportable number, use a short qualitative word instead.

For hero.stats:
- Prefer a single "title" with the full USP phrase (e.g. "Topel ambient", "Prijazne cene", "Osebni pristop").
- Do NOT split one phrase across value/label (BAD: { "value": "Topel", "label": "Ambient" }, { "value": "Prijazne", "label": "Cene" }).
- Numeric metrics may still use value + label (GOOD: { "value": "10+", "label": "let izkušenj" } only when yearsExperience supports it).
- You may still include value and label for backward compatibility when using title; set them to the same phrase or omit inventing a split.

For whyChooseUs.benefits, ALWAYS set "title" to ONE coherent short phrase that will be shown as the card heading (e.g. "Prijazne cene", "Osebni pristop", "Talno gretje"). Keep "description" as one supporting sentence. Also set "label" to the same phrase (schema requires label). Do NOT split a title across separate "stat" and "label" fields — never produce pairs like { "stat": "Ambient", "label": "Udobje" } or { "stat": "Dostopnost", "label": "Prijazne cene" }.

BAD benefits:
{ "stat": "Ambient", "label": "Udobje", "description": "..." }
{ "stat": "Dostopnost", "label": "Prijazne cene", "description": "..." }
GOOD benefits:
{ "title": "Prijeten ambient", "label": "Prijeten ambient", "description": "Sproščeno okolje, kjer se počutite dobrodošlo." }
{ "title": "Prijazne cene", "label": "Prijazne cene", "description": "Kakovostne storitve po dostopnih cenah za vso družino." }

BAD hero.stats (split phrase):
{ "value": "Topel", "label": "Ambient" }
{ "value": "Prijazne", "label": "Cene" }
GOOD hero.stats:
{ "title": "Topel ambient", "value": "Topel ambient", "label": "Topel ambient" }
{ "title": "Prijazne cene", "value": "Prijazne cene", "label": "Prijazne cene" }
{ "value": "7 dni", "label": "Odprti vsak teden" }

BAD stats (invented social proof):
{ "value": "100%", "label": "Zadovoljne stranke" }
{ "value": "20 let", "label": "Izkušenj" }
GOOD numeric stats (supported by the business input):
{ "value": "7 dni", "label": "Odprti vsak teden" }

The last example is only allowed when openingHours actually shows seven open days.

When information is missing, prefer conservative wording over an invented value. Write "Osebni pristop in strokovna obravnava" rather than "100% zadovoljnih strank".

Use realistic copy based on the provided business input. Match footer.address to the contact address.`;

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

  try {
    const config = validateGeneratedSiteConfig(validateSiteConfig(parsed));

    return validateClaims(config, input);
  } catch (error) {
    throw toContentError(error);
  }
}
