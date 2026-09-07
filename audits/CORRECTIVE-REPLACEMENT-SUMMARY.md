# Corrective replacement summary

Corrective QA for **16 FAIL/REVIEW residual slots** from post-replacement visual QA. Scope: reuse existing KEEP donors only; no new downloads; no `public/` binaries or `image-asset-cache` writes.

## Outcome

| Metric | Count |
|---|---:|
| Slots changed (`site.json` retarget) | 9 |
| Unresolved (left REVIEW) | 1 |
| Related heroes re-QA’d (asset unchanged) | 6 |
| FAIL remaining | 0 |
| REVIEW remaining (unresolved) | 1 |

## Changes

| Demo | Slot | Old donor | New donor | Reason | QA |
|---|---|---|---|---|---|
| `vodvrt-vodovodne-instalacije` | services | `pexels:6197122` (window cleaning) | `pexels:5691536` (radiator / peteks hero) | FAIL: garden alt + cleaning photo → plumbing/heating KEEP; alt corrected | **PASS** |
| `napeljava-vodovodnih-centralnih` | services | `pexels:32588555` (same as hero) | `pexels:5691536` | Within-demo duplicate → distinct plumbing/heating KEEP | **PASS** |
| `vodoinstalaterstvo-adi-dervis` | services | `pexels:32588555` (HVAC cabinet) | `local:/clients/umivalniki-dreams-obdelava/hero.jpg` | Alt drift: sanitary bathroom vs HVAC → bathroom sanitary KEEP | **PASS** |
| `pirnar-stanislav-avtoservis` | services | `pexels:8986105` (under-car / same as hero) | `pexels:6870316` (tire) | Tire alt + duplicate → tire KEEP | **PASS** |
| `avtoservis-celarc-crt` | services | `pexels:8986105` (same as hero) | `pexels:4315571` (engine diagnostics) | Duplicate → diagnostics KEEP matching services alt | **PASS** |
| `marko-cerekovic` | services | `local:elektro-ivan-troha/hero.jpg` | `local:elvip-elektroinstalacije-podboj/hero.jpg` | Duplicate panel → lighting-install KEEP; alt updated | **PASS** |
| `elektro-instalacije-kovac` | services | `local:elektro-ivan-troha/hero.jpg` | `local:elektro-ika-gregor/services.jpg` | Duplicate panel → fuse-box KEEP | **PASS** |
| `wise-electronics` | services | `local:elvip/…/services.jpg` (orb) | `local:elektro-ika-gregor/services.jpg` | Abstract orb → fuse-box KEEP matching omarice alt | **PASS** |
| `elektro-zagar-jan` | services | `local:elvip/…/services.jpg` (orb) | `local:elvip/…/hero.jpg` | Abstract orb → concrete lighting-install KEEP | **PASS** |

## Unresolved

| Demo | Slot | Current donor | Why unresolved | QA |
|---|---|---|---|---|
| `vulkanizerstvo-izdelava-kljucev` | services | `pexels:6870316` (tire) | Dual trade (vulkanizer + ključavničarstvo). No suitable existing KEEP for key-cutting/locksmith; only a REVIEW English DoorAlex pack exists. Tire donor kept for vulcanizing half. | **REVIEW** |

## Heroes reclassified (no asset change)

These heroes were REVIEW only because they matched services. After services differentiation they re-QA as **PASS**:

- `pirnar-stanislav-avtoservis:hero`
- `avtoservis-celarc-crt:hero`
- `vodoinstalaterstvo-adi-dervis:hero`
- `elektro-instalacije-kovac:hero`
- `marko-cerekovic:hero`
- `napeljava-vodovodnih-centralnih:hero`

## Constraints honored

- No new stock downloads
- No duplicate binaries / cache entries
- Provider / `sourceId` / `sourceUrl` / photographer fields copied from KEEP donors when present
- Local path donors kept the existing local-only metadata shape
- Semantic fit preferred over minimizing unique images
- Unresolved REVIEW preserved where no better KEEP exists

## Artifacts

- `audits/corrective-replacement-apply-log.json` — per-slot old/new donor + reason
- `audits/corrective-replacement-qa-report.json` — re-QA verdicts for all 16 residual slots
- `audits/CORRECTIVE-REPLACEMENT-SUMMARY.md` — this file
