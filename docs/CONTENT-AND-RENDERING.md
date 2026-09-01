# Content loading and rendering

> **Verified against code:** 2026-09-01  
> **Source of truth:** `src/content/get-site-config.ts`, `src/middleware.ts`, `src/appearances/registry.ts`, `src/app/site-page.tsx`, `src/images/generate-site-images.ts`.  
> **Stale / unverified:** none for routing/registry. Next.js 16 docs (`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`) rename Middleware → Proxy; this repo still exports `middleware` from `src/middleware.ts`.

---

## How SiteConfig loads

Webpack `require.context` at module init in `getSiteConfig.ts`:

1. Legacy: `./sites/*.json` (direct files only, not `_templates/`).
2. Clients: `./clients/*/site.json` — **same slug overwrites legacy**.

Every bundled object runs `validateSiteConfig()`.

`getSiteConfig(slug?)`:

- Explicit slug from the URL (`src/app/[slug]/page.tsx`).
- Else `process.env.SITE_SLUG ?? "default"` (`resolveSlug`).

Allowlist: `siteSlugs` = `clientSlugs ∪ legacySiteSlugs` (`src/content/sites/index.ts`). Missing slug → throw → `notFound()`.

**Vercel-only implication:** new JSON is invisible until the next `next build`. Local `next dev` re-bundles on restart/HMR depending on webpack context.

**`SITE_SLUG`:** Local-only convenience (`package.json` `dev:default` / `dev:test`). Production multi-tenant routing does not use it.

---

## Routing

App Router under `src/app/` only. No `pages/` router.

| Path | File | Notes |
|------|------|-------|
| `/` | `src/app/page.tsx` | `getSiteConfig()` with env/default — on zbrendiraj.si middleware rewrites `/` → `/zbrendiraj-si` |
| `/{slug}` | `src/app/[slug]/page.tsx` | `dynamic = "force-dynamic"` + `generateStaticParams` from `siteSlugs`. `after(recordDemoView)` |
| `/demo/{slug}` | rewrite | `src/middleware.ts` strips `/demo` prefix |
| `/{slug}/vsebina` | `vsebina/page.tsx` | Onboarding; requires `isCustomer` + token |
| `/{slug}/upsell` | `upsell/page.tsx` | Post-checkout |
| `/{slug}/hvala` | `hvala/page.tsx` | Thank-you; branches on `isCustomer` |
| `/{slug}/politika-zasebnosti` etc. | per-slug legal | `getLegalPageContext(kind, slug)` |
| `/politika-zasebnosti` etc. | root legal | custom-domain / `SITE_SLUG` context |
| `/pogosta-vprasanja` | root FAQ | hardcodes `zbrendiraj-si` + appearance `zbrendiraj` |
| `/admin/*` | `src/app/admin/` | cookie gate; `/admin/login` exempt; 503 if no `ADMIN_SECRET` |

**Custom domains** (`getSlugForHost` in `src/lib/custom-domains.ts`): only `zbrendiraj.si` / `www.zbrendiraj.si` → `zbrendiraj-si`. Middleware rewrites only `CUSTOM_DOMAIN_ROOT_PATHS`: `/`, `/politika-zasebnosti`, `/piskotki`, `/splosni-pogoji`, `/pogosta-vprasanja`. **Partial:** `/vsebina`, `/upsell`, `/hvala` are **not** rewritten on the custom host.

**Retired host:** `splet.vercel.app` → 308 `zbrendiraj.si` (middleware + `next.config.ts` redirects).

---

## Appearances

`appearanceRegistry` (`src/appearances/registry.ts`):

| ID | Page component |
|----|----------------|
| `default` | `DefaultSitePage` |
| `beauty` | `BeautySitePage` |
| `zbrendiraj` | `ZbrendirajSitePage` (manual; marketing site) |
| `elektro`, `construction`, `cleaning`, `health`, `auto` | `TradeSitePage` |

**Generation:** `appearanceForIndustry(`${industry} ${companyName}`)` (`industry-appearance.ts`) — first regex match; else `default`. Never `zbrendiraj`.

**Runtime:** `resolveAppearance(siteConfig.appearance)` → registry lookup in `SitePage`.

### Add a new appearance

1. `APPEARANCE_IDS` in `src/appearances/types.ts`
2. Zod `appearanceSchema` in `validate-site-config.ts` **and** `site-config.schema.json` enum
3. `{ id, Page }` in `registry.ts`
4. `src/appearances/{id}/…SitePage.tsx`
5. Optional keywords in `industry-appearance.ts`
6. Theme: `appearanceToMode` / palette filters in `assign-theme.ts`; `resolveThemeCssVars`
7. Optional layout assign in `generate-client.ts`

---

## Theme / palettes / fonts

| Concern | File | Function |
|---------|------|----------|
| Assign at gen | `src/theme/assign-theme.ts` | `assignTheme(slug, appearance)` |
| Mode | same | beauty → light; trade → 50/50; else dark |
| Palettes | `src/theme/palettes/` | `getPalette`, `getPalettesForMode` |
| Fonts | `src/theme/fonts/pairings.ts`, `load-fonts.ts` | `fontVariables` on `<html>` in `layout.tsx` |
| Runtime CSS | `src/theme/resolve-theme.ts` | `resolveThemeCssVars` |

AI must not emit `appearance`, `theme`, or `images` — prompt + post-process in `generate-client.ts`.

---

## Look catalog (factory)

Curated **160 looks** (16 image-pool categories × 10 archetypes) live under `src/catalog/`.

| Concern | File | Function |
|---------|------|----------|
| Types | `src/catalog/types.ts` | `SiteLookDefinition`, `LookDesignTokens` |
| Registry | `src/catalog/looks/` | `getLook()`, `getLooksForCategory()` |
| Assign at gen | `src/catalog/assign-look.ts` | `assignLook(categoryId, slug)` — hash + collision avoidance |
| Runtime CSS | `src/catalog/resolve-look-css.ts` | `resolveLookCssVars(look)` |
| Runtime resolve | `src/catalog/resolve-look.ts` | `resolveLookForSite(config)` |
| Palettes | `src/catalog/palettes/` | 160 generated palettes (`look-{category}-{01-10}-{mood}`) |
| Fonts | `src/catalog/fonts/` | 160 pairing IDs (`look-{category}-{01-10}`) |
| Admin UI | `/admin/catalog` | Filter by category, preview swatches |

**Generation flow** (`generate-client.ts`):

1. `resolveImagePoolCategory({ industry, companyName })`
2. If matched → `assignLook(categoryId, slug)` → writes `lookId` + denormalized `appearance`, `theme`, `layout`
3. Else → legacy `appearanceForIndustry` + `assignTheme` + `assignBeautyLayout` / `assignTradeLayout`

**Runtime** (`site-page.tsx`): if `siteConfig.lookId` → `resolveLookCssVars`; else `resolveThemeCssVars`.

**Backward compat:** existing `site.json` without `lookId` render unchanged. Optional backfill: `npm run backfill-look-ids` (skip existing unless `--force`).

**Validation:** `npm run validate-catalog` (WCAG AA + uniqueness per category).

---

## Images

```
generateSiteImages()
  → buildImageSearchPlan()          [Gemini always]
  → resolveImagePoolCategory()
  → generateImagesFromPool()        [Pexels ingest only]
      OR downloadStockPhoto()       [Pexels → Unsplash]
  → optimizeStockImage()            [AVIF + WebP]
  → storeClientImages()             [Blob or public/]
```

Pool cache: `data/image-asset-cache.json` (`src/images/asset-cache.ts`). Unsplash limiter: `data/.unsplash-search-times.json` (45 searches/hour, `unsplash-rate-limit.ts`).

**Missing:** Unsplash ingest into the pool.

---

## Shared vs appearance-specific

**Shared (`src/components/`):** Hero, Services, Benefits, Contact, Gallery, Pricing sections; Button; legal footer; `ContactForm`.

| Appearance | Mix |
|------------|-----|
| default | almost all shared |
| trade | shared header/footer/gallery/pricing/contact + trade hero/services/benefits |
| beauty | custom chrome; shared gallery/pricing |
| zbrendiraj | fully custom; reuses `ContactForm`, `LegalFooterLinks` |

Chrome bars (`site-page.tsx`): purchase bar if not customer and not `zbrendiraj`; preparing bar if customer and not `live`.

---

## AI guards

| Layer | File |
|-------|------|
| Raw Places-ish input | `src/ai/validate-raw-business-data.ts` |
| BusinessInput | `src/ai/validate-business-input.ts` |
| SiteConfig Zod | `src/content/validate-site-config.ts` |
| Quality bounds | `src/ai/validate-generated-site-config.ts` |
| Claims | `src/ai/validate-claims.ts` |
| Parse chain | `src/ai/providers/prompt.ts` → `parseAndValidateSiteConfig` |
| Providers | `AI_PROVIDER` default `openai` (`src/ai/providers/index.ts`) |

Models (code): OpenAI `gpt-4.1-mini`; Gemini `gemini-3.5-flash-lite`. All Gemini calls go through `generateGeminiContent` (`gemini-request.ts`).

Privacy/legal copy is **not** AI-generated per customer — templates in `src/privacy/components/` ([PRIVACY.md](./PRIVACY.md)).

---

## Open questions

- Whether webpack `require.context` remains supported long-term under Next 16 bundling — used today; if it breaks, `get-site-config.ts` is the hotspot.
- Custom-domain map for paying customers: not implemented; onboarding collects `desiredDomain` in answers only.
