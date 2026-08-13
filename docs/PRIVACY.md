# Zasebnost in skladnost (V1)

Sistem zagotavlja avtomatsko generirane strani **Politika zasebnosti** in **Politika piškotkov** za vsako stranko, povezave v footerju ter SMTP kontaktni obrazec.

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

## SMTP za kontaktni obrazec

Kontaktni obrazec pošilja sporočila prek `POST /api/contact` na `business.email`.

Nastavite v `.env.local` / produkciji:

```bash
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

**Resend se ne uporablja** za stranke strank. Outreach sistem ostaja ločen.

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
