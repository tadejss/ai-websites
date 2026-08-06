# Business Input Template

Use this template to collect the information needed to generate a local business website. Copy the **Prompt input** section into an AI assistant, fill in each field, and combine it with the generator prompt in `docs/SITE_GENERATOR_PROMPT.md`.

**Related files:**
- `scripts/site-input.example.json` — structured JSON input for `scripts/generate-site.ts`
- `docs/SITE_GENERATOR_PROMPT.md` — prompt that produces a valid `SiteConfig` JSON
- `src/content/site-config.schema.json` — output contract

---

## What to provide

### Company name

The full legal or trading name of the business.

- Used for branding, page title, and footer.
- If the name has a natural split (e.g. "Avto Servis Novak"), note which part should be emphasized.

**Example:** Kavarna Central

---

### Industry

The type of business and market it operates in.

- Be specific enough for relevant copy (not just "services").
- Mention location context if relevant (e.g. "butična kavarna v centru Ljubljane").

**Example:** Butična kavarna — specialty kava, domače slaščice, lokalna stranka

---

### Target customers

Who the website should speak to.

- Describe ideal customers: individuals, families, businesses, tourists, etc.
- Note their main needs, problems, or expectations.
- Helps the AI choose tone, benefits, and call-to-action wording.

**Example:** Mestni prebivalci in turisti, ki iščejo kakovostno kavo in prijeten ambient za srečanja ali delo na daljavo.

---

### Services

A list of main services or products offered (typically 4–6 items).

- Use short, clear names.
- Add a one-line description per service if you want richer output.
- Order from most important to least important.

**Example:**
1. Specialty kava — sveže mleta kava iz preverjenih pridelovalcev
2. Domače slaščice — sveže pečene torte in pecivo
3. Kosila — dnevna ponudba jedi
4. Catering — storitev za dogodke in pisarne

---

### Unique selling points

What makes this business different from competitors (3–5 bullets).

- Focus on concrete advantages: experience, speed, quality, price transparency, location, certifications.
- Avoid vague claims without substance.

**Example:**
- 15+ let tradicije v centru mesta
- 100 % domače pecivo, pečeno vsak dan
- Specialty kava iz neodvisnih pražarn
- Prijeten ambient z teraso

---

### Contact details

Information visitors need to get in touch or visit.

| Detail | Example |
|--------|---------|
| Address | Glavna ulica 5, 1000 Ljubljana |
| Phone | +386 1 234 56 78 |
| Email | info@kavarna-central.si |
| Opening hours | Pon–Pet: 7:00–20:00 · Sob–Ned: 8:00–22:00 |
| Website (optional) | https://kavarna-central.si |
| Social links (optional) | Instagram: @kavarnacentral |

Use realistic formats. Phone and email will become clickable links on the site.

---

### Tone / style preferences

How the website should feel and sound.

Describe preferences such as:

- **Tone:** professional, friendly, premium, casual, trustworthy, modern
- **Voice:** formal "vi" vs informal "ti" (if applicable)
- **Emphasis:** speed, craftsmanship, family tradition, innovation, local community
- **Avoid:** jargon, overly salesy language, specific words or phrases

**Example:** Topel, profesionalen ton. Poudarek na kakovosti in domačnosti. Ne uporabljaj agresivne prodajne retorike.

---

### Language

The language for all visible website text.

- Default for this template: **Slovenian**
- Specify regional variant or formality if needed.

**Example:** Slovenščina (formalno, "vi")

---

## Prompt input

Copy the block below, replace the placeholder text, and paste it into your AI assistant together with the generation prompt.

```
Generate a local business website using the following business information.

## Company name
[Full business name]

## Industry
[Business type and brief context]

## Target customers
[Who the site is for and what they need]

## Services
1. [Service name] — [optional short description]
2. [Service name] — [optional short description]
3. [Service name] — [optional short description]
4. [Service name] — [optional short description]

## Unique selling points
- [Selling point 1]
- [Selling point 2]
- [Selling point 3]
- [Selling point 4]

## Contact details
- Address: [street, city, postal code]
- Phone: [phone number]
- Email: [email address]
- Opening hours: [hours by day]

## Tone / style preferences
[How the copy should sound; what to emphasize or avoid]

## Language
[Target language, e.g. Slovenian]
```

---

## Tips for better results

- **Be specific.** Real details produce better copy than generic placeholders.
- **Keep services focused.** Four to six clear services work better than a long unstructured list.
- **Match contact details.** Use the same address in all fields you provide.
- **State the primary action.** If you want a specific CTA (e.g. "Rezerviraj mizo", "Pridobi ponudbo"), mention it under tone/preferences.
- **Review the output.** Generated JSON must validate against `src/content/site-config.schema.json` before saving to `src/content/sites/{slug}.json`.

---

## Filled example

```
Generate a local business website using the following business information.

## Company name
Kavarna Central

## Industry
Butična kavarna v centru Ljubljane — specialty kava in domače slaščice

## Target customers
Mestni prebivalci, turisti in remote delavci, ki iščejo kakovostno kavo in prijeten ambient.

## Services
1. Specialty kava — sveže mleta kava iz neodvisnih pražarn
2. Domače slaščice — sveže pečene torte in pecivo vsak dan
3. Dnevna kosila — sezonska ponudba jedi
4. Catering — storitev za dogodke in pisarne

## Unique selling points
- 15+ let tradicije v centru mesta
- 100 % domače pecivo
- Specialty kava z rotirajočo ponudbo
- Terasa z razgledom na mestno jedro

## Contact details
- Address: Glavna ulica 5, 1000 Ljubljana
- Phone: +386 1 234 56 78
- Email: info@kavarna-central.si
- Opening hours: Pon–Pet: 7:00–20:00 · Sob–Ned: 8:00–22:00

## Tone / style preferences
Topel, premium ton. Poudarek na kakovosti in lokalni tradiciji. Brez agresivne prodaje.

## Language
Slovenian
```
