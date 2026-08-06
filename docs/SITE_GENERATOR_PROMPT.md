# SiteConfig Generator Prompt

Copy the prompt below into an AI assistant. Fill in the **Business input** section with real details, then run the prompt. The model must return **only** a valid `SiteConfig` JSON object.

**Contract:** `src/content/site-config.schema.json`  
**Reference example:** `examples/site-config.example.json`

---

## Business input

Provide these details before running the prompt:

| Field | Your answer |
|-------|-------------|
| Business name | |
| Business type / industry | |
| Tagline or one-line pitch | |
| Address | |
| Phone | |
| Email | |
| Opening hours | |
| Primary language | (default: Slovenian) |
| Services (4–6 items) | |
| Key selling points (3–4 bullets) | |
| Trust stats for hero (4 items, e.g. years, rating) | |
| Primary CTA label | (e.g. "Rezerviraj termin") |

---

## Prompt

```
You generate a SiteConfig JSON file for a local business website.

## Contract

The output MUST conform exactly to the JSON Schema at:
src/content/site-config.schema.json

Study that schema before generating. Every required field must be present. Do not add keys that are not defined in the schema (`additionalProperties: false` on all objects).

## Business information

Use the following input to write specific, realistic copy. Do not leave generic placeholders when real details are provided.

- Business name: {{BUSINESS_NAME}}
- Business type / industry: {{BUSINESS_TYPE}}
- Tagline or one-line pitch: {{TAGLINE}}
- Address: {{ADDRESS}}
- Phone: {{PHONE}}
- Email: {{EMAIL}}
- Opening hours: {{OPENING_HOURS}}
- Language: {{LANGUAGE}}
- Services:
  {{SERVICES_LIST}}
- Key selling points:
  {{SELLING_POINTS}}
- Hero trust stats:
  {{HERO_STATS}}
- Primary CTA label: {{PRIMARY_CTA}}

## Output rules

1. Return ONLY valid JSON — no markdown fences, no comments, no explanation before or after the JSON.
2. Include all eight top-level keys: `brand`, `metadata`, `nav`, `hero`, `services`, `whyChooseUs`, `contact`, `footer`.
3. Fill every required nested field defined in the schema.
4. Do not add extra keys at any level.
5. Write all visible text in the specified language.

## Icon rules

Use ONLY these exact `icon` values (no other strings):

- `building`, `menu`, `check` (reserved for UI — do not use in generated content unless needed)
- `location` — address
- `phone` — phone number
- `email` — email address
- `clock` — opening hours
- `service-1`, `service-2`, `service-3`, `service-4`, `service-5`, `service-6` — service cards

Assign a unique `service-N` icon to each item in `services.items`. Use `location`, `phone`, `email`, and `clock` for the matching contact items.

## Nav and section ID rules

Navigation links must stay synchronized with section anchor IDs:

| Section object   | Field | Typical value | Nav link href |
|------------------|-------|---------------|---------------|
| `services`       | `id`  | `storitve`    | `#storitve`   |
| `whyChooseUs`    | `id`  | `zakaj-mi`    | `#zakaj-mi`   |
| `contact`        | `id`  | `kontakt`     | `#kontakt`    |

Rules:
- Every in-page `nav.links[].href` must be `#` + the target section's `id`.
- Use lowercase, URL-safe IDs (letters, numbers, hyphens only).
- If you change a section `id`, update the matching nav link.
- `hero.primaryCta` and `nav.cta` should use the same intent as the primary call-to-action (they link to `contact.id` in the UI).
- `hero.secondaryCta` should relate to services (links to `services.id` in the UI).

## Structure checklist

### brand
- `prefix` + `highlight` — split the business name for logo styling (e.g. prefix: "Avto Servis", highlight: "Novak").

### metadata
- `title` — SEO page title including business name.
- `description` — SEO meta description (1–2 sentences).

### nav
- `links` — exactly three links pointing to services, whyChooseUs, and contact sections.
- `cta` — short primary action label.

### hero
- `badge`, `title`, `titleHighlight`, `description`, `primaryCta`, `secondaryCta`
- `stats` — array of 4 objects: `{ "value": string, "label": string }`

### services
- `id`, `eyebrow`, `title`, `description`
- `items` — 4–6 services, each with `title`, `description`, `icon` (`service-1` … `service-6`)

### whyChooseUs
- `id`, `eyebrow`, `title`, `description`
- `highlights` — 3–4 short bullet strings
- `benefits` — 3 objects: `{ "stat", "label", "description" }`

### contact
- `id`, `eyebrow`, `title`, `description`
- `items` — include address (`location`), phone (`phone`, with `href: "tel:..."`), email (`email`, with `href: "mailto:..."`), and hours (`clock`). Omit `href` for non-clickable items.
- `form` — all nine fields: `title`, `description`, `nameLabel`, `namePlaceholder`, `phoneLabel`, `phonePlaceholder`, `messageLabel`, `messagePlaceholder`, `submitLabel`

### footer
- `address` — match the contact address
- `rights` — copyright line (e.g. "Vse pravice pridržane.")

## Content quality

- Tailor copy to the business type and location.
- Use realistic phone formatting and valid `tel:` / `mailto:` hrefs.
- Keep descriptions concise; suitable for a professional landing page.
- Ensure JSON is syntactically valid: double quotes, no trailing commas.

Generate the complete SiteConfig JSON now.
```

---

## After generation

1. Validate the JSON against `src/content/site-config.schema.json`.
2. Save to `src/content/sites/{slug}.json`.
3. Load with `getSiteConfig("{slug}")` or set `SITE_SLUG={slug}`.

See also: `docs/AI_GENERATION.md` for field-by-field documentation.
