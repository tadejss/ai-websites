import type { SiteConfig } from "@/content/types/site";
import { validateSiteConfig } from "@/content/validate-site-config";
import type { BusinessInput } from "../types";

export const SYSTEM_PROMPT = `You generate SiteConfig JSON for a local business website.

Return ONLY a valid JSON object. No markdown, comments, or extra text.

Required top-level keys:
brand, metadata, nav, hero, services, whyChooseUs, contact, footer

Do not add extra keys at any level.

Write all visible text in Slovenian unless the business input specifies another language.

Icon rules — use ONLY these exact values:
location, phone, email, clock, service-1, service-2, service-3, service-4, service-5, service-6

Nav and section ID rules:
- services.id = "storitve", nav href "#storitve"
- whyChooseUs.id = "zakaj-mi", nav href "#zakaj-mi"
- contact.id = "kontakt", nav href "#kontakt"

Structure requirements:
- brand: { prefix, highlight } — split the company name for logo styling
- metadata: { title, description }
- nav: { links: [{ href, label } x3], cta }
- hero: { badge, title, titleHighlight, description, primaryCta, secondaryCta, stats }
  - stats: 4 items with { value, label }
- services: { id, eyebrow, title, description, items }
  - items: 4-6 services, each { title, description, icon } with unique service-N icons
- whyChooseUs: { id, eyebrow, title, description, highlights, benefits }
  - highlights: 3-4 strings
  - benefits: 3 items with { stat, label, description }
- contact: { id, eyebrow, title, description, items, form }
  - items: address (location), phone (phone + tel: href), email (email + mailto: href), hours (clock)
  - form: all nine label/placeholder/submit fields
- footer: { address, rights }

Use realistic copy based on the provided business input. Match footer.address to the contact address.`;

export function buildUserPrompt(input: BusinessInput): string {
  return `Generate a SiteConfig JSON object for this business:

${JSON.stringify(input, null, 2)}`;
}

export function parseAndValidateSiteConfig(
  content: string,
  providerName: string,
): SiteConfig {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`${providerName} returned invalid JSON`);
  }

  return validateSiteConfig(parsed);
}
