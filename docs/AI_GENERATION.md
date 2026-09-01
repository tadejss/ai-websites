# AI SiteConfig Generation Guide

> **STALE (2026-09-01):** Factory output path is `src/content/clients/{slug}/site.json`, not `src/content/sites/{slug}.json` (legacy loader still exists; almost no live files there). Optional top-level keys (`appearance`, `theme`, `layout`, `images`, `business`, `privacy`, `sections`, `gallery`, `pricing`) **are** allowed by `site-config.schema.json` — do not treat “eight keys only / no extras” as current. Pipeline: [CONTENT-AND-RENDERING.md](./CONTENT-AND-RENDERING.md), [FACTORY.md](./FACTORY.md).

This document explains how to generate a valid `SiteConfig` JSON file for this project. The output must match the TypeScript contract in `src/content/types/site.ts` and validate against `src/content/site-config.schema.json`.

## Output location

**Current (factory):** `src/content/clients/{slug}/site.json` (+ `business.json`).

**Legacy (still loaded if present):**

```
src/content/sites/{slug}.json
```

Example: a legacy file `src/content/sites/kavarna-central.json` is loaded with `getSiteConfig("kavarna-central")` or by setting `SITE_SLUG=kavarna-central`. Clients with the same slug **win**.

---

## Required top-level fields

Every `SiteConfig` JSON object must include all eight top-level keys:

| Field | Purpose |
|-------|---------|
| `brand` | Company name split for logo styling (`prefix` + `highlight`) |
| `metadata` | SEO title and description |
| `nav` | Navigation links and CTA button text |
| `hero` | Homepage headline, CTAs, and trust stats |
| `services` | Services section content and anchor `id` |
| `whyChooseUs` | Benefits section content and anchor `id` |
| `contact` | Contact details, form labels, and anchor `id` |
| `footer` | Footer address and copyright text |

The eight keys in the table below are **required**. Optional keys (`appearance`, `theme`, `layout`, `images`, `business`, `privacy`, `sections`, `gallery`, `pricing`) are valid per `site-config.schema.json`. Do not omit required fields.

---

## Section structure

### `brand`

```json
{
  "prefix": "Kavarna",
  "highlight": "Central"
}
```

- `prefix` — first part of the name (neutral color)
- `highlight` — accent-colored part of the name

### `metadata`

```json
{
  "title": "Kavarna Central | Kava in slaščice",
  "description": "Butična kavarna v centru mesta z domačimi slaščicami."
}
```

### `nav`

```json
{
  "links": [
    { "href": "#storitve", "label": "Storitve" },
    { "href": "#zakaj-mi", "label": "Zakaj mi" },
    { "href": "#kontakt", "label": "Kontakt" }
  ],
  "cta": "Rezerviraj termin"
}
```

### `hero`

Required fields: `badge`, `title`, `titleHighlight`, `description`, `primaryCta`, `secondaryCta`, `stats`

- `stats` — array of `{ "value": string, "label": string }` (typically 4 items)
- Hero buttons link to `#${contact.id}` and `#${services.id}` — ensure those IDs exist

### `services`

Required fields: `id`, `eyebrow`, `title`, `description`, `items`

Each item in `items`:

```json
{
  "title": "Service name",
  "description": "Short description.",
  "icon": "service-1"
}
```

### `whyChooseUs`

Required fields: `id`, `eyebrow`, `title`, `description`, `highlights`, `benefits`

- `highlights` — array of strings (bullet points)
- `benefits` — array of `{ "stat", "label", "description" }` (typically 3 items)

### `contact`

Required fields: `id`, `eyebrow`, `title`, `description`, `items`, `form`

Each item in `items`:

```json
{
  "label": "Telefon",
  "value": "+386 1 234 56 78",
  "href": "tel:+38612345678",
  "icon": "phone"
}
```

- `href` is optional (omit for plain text like address or opening hours)
- `form` — all label, placeholder, and submit text fields are required

### `footer`

```json
{
  "address": "Ulica 123, 1000 Ljubljana",
  "rights": "Vse pravice pridržane."
}
```

---

## Allowed icon names

Use only these exact values for `icon` fields in `services.items` and `contact.items`:

| Icon | Typical use |
|------|-------------|
| `building` | Brand / business (internal) |
| `menu` | Mobile menu (internal) |
| `check` | Highlight lists (internal) |
| `location` | Address |
| `phone` | Phone number |
| `email` | Email address |
| `clock` | Opening hours |
| `service-1` | Service card |
| `service-2` | Service card |
| `service-3` | Service card |
| `service-4` | Service card |
| `service-5` | Service card |
| `service-6` | Service card |

Do not invent new icon names.

---

## Nav links and section IDs

Navigation uses anchor links that must match section `id` values exactly.

### Rules

1. Every `nav.links[].href` for in-page sections must be `#` + the target section's `id`
2. These three sections must exist and stay in sync:

| Section | Typical `id` | Nav `href` |
|---------|--------------|------------|
| `services` | `"storitve"` | `"#storitve"` |
| `whyChooseUs` | `"zakaj-mi"` | `"#zakaj-mi"` |
| `contact` | `"kontakt"` | `"#kontakt"` |

3. If you change a section `id`, update the matching nav link and any hardcoded hero/nav references
4. Hero `primaryCta` scrolls to `contact.id`; hero `secondaryCta` scrolls to `services.id`
5. Navbar CTA also links to `contact.id`
6. Use lowercase, URL-safe IDs (letters, numbers, hyphens) — no spaces

### Valid example

```json
"nav": {
  "links": [
    { "href": "#storitve", "label": "Storitve" },
    { "href": "#zakaj-mi", "label": "Zakaj mi" },
    { "href": "#kontakt", "label": "Kontakt" }
  ],
  "cta": "Rezerviraj termin"
},
"services": { "id": "storitve", "...": "..." },
"whyChooseUs": { "id": "zakaj-mi", "...": "..." },
"contact": { "id": "kontakt", "...": "..." }
```

### Invalid example

```json
"nav": {
  "links": [
    { "href": "#services", "label": "Storitve" }
  ]
},
"services": { "id": "storitve" }
```

`#services` does not match `id: "storitve"` — the link will not scroll to the section.

---

## Content guidelines

- Write all visible text in the target language (default: Slovenian)
- Keep copy specific to the business — avoid generic placeholder tone when real details are provided
- Use realistic phone formats and `tel:` / `mailto:` hrefs when links are clickable
- Match `footer.address` to the contact address when possible
- Include 4–6 `services.items`, 3–4 `hero.stats`, 3 `whyChooseUs.benefits`, and 4 `whyChooseUs.highlights` for best layout
- Return **only valid JSON** — no comments, no trailing commas, no markdown fences in the final file

---

## Minimal example

```json
{
  "brand": {
    "prefix": "Kavarna",
    "highlight": "Central"
  },
  "metadata": {
    "title": "Kavarna Central | Kava in slaščice",
    "description": "Butična kavarna v centru mesta."
  },
  "nav": {
    "links": [
      { "href": "#storitve", "label": "Ponudba" },
      { "href": "#zakaj-mi", "label": "O nas" },
      { "href": "#kontakt", "label": "Kontakt" }
    ],
    "cta": "Rezerviraj mizo"
  },
  "hero": {
    "badge": "Odprto danes do 20:00",
    "title": "Kava in domače slaščice v",
    "titleHighlight": "srcu mesta",
    "description": "Butična kavarna s specialty kavo in svežimi pecivi.",
    "primaryCta": "Rezerviraj mizo",
    "secondaryCta": "Naša ponudba",
    "stats": [
      { "value": "15+", "label": "let tradicije" },
      { "value": "4,8", "label": "povprečna ocena" },
      { "value": "20+", "label": "vrst kave" },
      { "value": "100 %", "label": "domače pecivo" }
    ]
  },
  "services": {
    "id": "storitve",
    "eyebrow": "Ponudba",
    "title": "Kaj ponujamo",
    "description": "Od jutranje kave do popoldanskih sladic.",
    "items": [
      {
        "title": "Specialty kava",
        "description": "Sveže mleta kava iz preverjenih pridelovalcev.",
        "icon": "service-1"
      },
      {
        "title": "Domače slaščice",
        "description": "Sveže pečene torte in pecivo vsak dan.",
        "icon": "service-2"
      }
    ]
  },
  "whyChooseUs": {
    "id": "zakaj-mi",
    "eyebrow": "O nas",
    "title": "Zakaj obiskati nas",
    "description": "Skrbimo za kakovost v vsakem detajlu.",
    "highlights": [
      "Sveže pripravljena kava",
      "Domače sestavine",
      "Prijeten ambient"
    ],
    "benefits": [
      {
        "stat": "15+",
        "label": "let izkušenj",
        "description": "Dolgoletna tradicija v centru mesta."
      }
    ]
  },
  "contact": {
    "id": "kontakt",
    "eyebrow": "Kontakt",
    "title": "Obiščite nas",
    "description": "Rezervirajte mizo ali nas pokličite.",
    "items": [
      {
        "label": "Naslov",
        "value": "Glavna ulica 5, 1000 Ljubljana",
        "icon": "location"
      },
      {
        "label": "Telefon",
        "value": "+386 1 234 56 78",
        "href": "tel:+38612345678",
        "icon": "phone"
      }
    ],
    "form": {
      "title": "Pošljite povpraševanje",
      "description": "Odgovorimo v enem delovnem dnevu.",
      "nameLabel": "Ime in priimek",
      "namePlaceholder": "Ime Priimek",
      "phoneLabel": "Telefon",
      "phonePlaceholder": "+386 40 123 456",
      "messageLabel": "Sporočilo",
      "messagePlaceholder": "Kako vam lahko pomagamo?",
      "submitLabel": "Pošlji"
    }
  },
  "footer": {
    "address": "Glavna ulica 5, 1000 Ljubljana",
    "rights": "Vse pravice pridržane."
  }
}
```

---

## Validation

Before saving, confirm:

- [ ] All 8 top-level fields are present
- [ ] All `icon` values are from the allowed list
- [ ] Nav `href` values match `services.id`, `whyChooseUs.id`, and `contact.id`
- [ ] JSON is valid (no syntax errors)
- [ ] File is saved to `src/content/sites/{slug}.json`

Reference schema: `src/content/site-config.schema.json`
