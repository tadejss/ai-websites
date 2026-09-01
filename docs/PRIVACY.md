# Zasebnost in skladnost (V1)

> **STALE (2026-09-01):** Kontaktni obrazec pošilja **Resend** (`src/contact/send-email.ts`), ne SMTP/`nodemailer` (`nodemailer` is an unused package.json dependency). Rest of the legal-page contract is still the code path in `src/privacy/`.

Sistem zagotavlja avtomatsko generirane strani **Politika zasebnosti** in **Politika piškotkov** za vsako stranko, povezave v footerju ter kontaktni obrazec (Resend).

## Strani

- `/{slug}/politika-zasebnosti`
- `/{slug}/piskotki`

Pri single-tenant deployu (env `SITE_SLUG`):

- `/politika-zasebnosti`
- `/piskotki`

## Konfiguracija v `site.json`

Vsaka stran ima bloke `business` in `privacy`. Privzeta V1 konfiguracija:

- kontaktni obrazec: omogočen
- analitika: izklopljena
- marketing: izklopljen
- rezervacije (zunanja povezava): izklopljene
- Google Maps / YouTube embedi: izklopljeni
- neesencialni piškotki: izklopljeni
- **brez cookie bannerja**

Pravna besedila so centralna predloga v `src/privacy/components/` (slovenščina). AI jih ne generira na stranko.

## Kontaktni obrazec (Resend)

Kontaktni obrazec pošilja sporočila prek `POST /api/contact` → `sendContactEmail` (`src/contact/send-email.ts`) na `business.email`.

Nastavite v `.env.local` / produkciji:

```bash
RESEND_API_KEY=
```

From-naslov v kodi je fiksen: `Zbrendiraj.si <noreply@zbrendiraj.si>`. `SMTP_*` spremenljivk koda ne bere. `nodemailer` v `package.json` nima importov.

Outreach e-pošta (legacy cold email) ostaja ločena (`src/outreach/`).

## Backfill obstoječih strani

```bash
npm run backfill-privacy
```

## Preverjanje

```bash
npm run test-privacy
npm run lint
npx tsc --noEmit
npm run build
```

## Manjkajoči podatki

Če `business.email` manjka, kontaktni obrazec vrne napako in `test-privacy` izpiše opozorilo. Matična številka in ID za DDV se ne izmišljujeta — dodajte jih ročno v `site.json`, ko so na voljo.
