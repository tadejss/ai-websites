# Post-replacement visual QA

Read-only QA of **121 slots** across **114 demos** from the high-impact replacement batch. No site.json/assets/cache/binaries modified.

## Summary

| Classification | Count |
|---|---:|
| PASS | 105 |
| REVIEW | 15 |
| FAIL | 1 |
| Pass rate | 86.8% |

## FAIL

| Demo | Slot | Old | New | Score | Reason |
|---|---|---|---|---:|---|
| `vodvrt-vodovodne-instalacije` | services | `pexels:1029635` | `pexels:6197122` | 28 | Services alt and copy emphasize garden/exterior landscaping ("Urejanje vrta"), but donor is indoor window cleaning — wrong section purpose for this demo. |

## REVIEW

| Demo | Slot | Old | New | Score | Reason |
|---|---|---|---|---:|---|
| `vodoinstalaterstvo-adi-dervis` | services | `pexels:33388390` | `pexels:32588555` | 48 | Alt describes bathroom sanitary install; donor shows HVAC/heat-pump style cabinet work. Same-trade family but section mismatch + within-demo duplicate. |
| `elektro-instalacije-kovac` | services | `pexels:10871585` | `local:/clients/elektro-ivan-troha/hero.jpg` | 55 | Within-demo duplicate of hero panel shot; services should differentiate (wiring/lighting/detail). |
| `marko-cerekovic` | services | `hash:8555282400b5f761` | `local:/clients/elektro-ivan-troha/hero.jpg` | 55 | Alt implies tools/equipment for services; shows same panel-work hero. Within-demo duplicate and weak services-specific purpose. |
| `pirnar-stanislav-avtoservis` | services | `pexels:28153670` | `pexels:8986105` | 58 | Same under-car mechanic photo as hero; alt promises tire/vulkanizer services but visual shows general service bay, not tire work. Within-demo duplicate. |
| `napeljava-vodovodnih-centralnih` | services | `pexels:7220892` | `pexels:32588555` | 60 | Within-demo duplicate; both slots show same HVAC maintenance scene. |
| `elektro-zagar-jan` | services | `hash:c254d8db5b5f1c6f` | `local:/clients/elvip-elektroinstalacije-podboj/services.jpg` | 62 | Abstract lighting orb; improved vs chaotic meters, but thin trade storytelling for services. |
| `wise-electronics` | services | `hash:c254d8db5b5f1c6f` | `local:/clients/elvip-elektroinstalacije-podboj/services.jpg` | 62 | Abstract filament-bulb mood shot; related to lighting but weak as concrete elektro-services proof. |
| `avtoservis-celarc-crt` | services | `pexels:9626877` | `pexels:8986105` | 65 | Within-demo duplicate of hero lift-bay photo; services loses distinct supporting visual. |
| `pirnar-stanislav-avtoservis` | hero | `pexels:9626877` | `pexels:8986105` | 68 | Trade-fit mechanic lift bay (PASS-quality donor) but identical image also used on services — weak page variety. |
| `avtoservis-celarc-crt` | hero | `pexels:28153670` | `pexels:8986105` | 70 | Good auto-trade donor, but identical image reused on services within the same demo. |
| `vodoinstalaterstvo-adi-dervis` | hero | `pexels:1029635` | `pexels:32588555` | 70 | Plumbing/HVAC donor OK for vodoinštalaterstvo, but identical image on services and scene is equipment cabinet more than pipework. |
| `elektro-instalacije-kovac` | hero | `pexels:33314764` | `local:/clients/elektro-ivan-troha/hero.jpg` | 72 | Strong EU panel match for elektro, but same image also on services. |
| `marko-cerekovic` | hero | `hash:31a9c52ff8409bbd` | `local:/clients/elektro-ivan-troha/hero.jpg` | 72 | Excellent EU panel photo for elektro, but identical asset reused as services — overreuse within demo. |
| `vulkanizerstvo-izdelava-kljucev` | services | `hash:8555282400b5f761` | `pexels:6870316` | 72 | Tire-change donor fits vulcanizing half of dual trade (vulkanizerstvo + ključavničarstvo); key-cutting still unrepresented. |
| `napeljava-vodovodnih-centralnih` | hero | `pexels:32588548` | `pexels:32588555` | 74 | HVAC/plumbing donor fits vodovod+ogrevanje, but identical image reused on services. |

## Over-reuse

### Within-demo identical hero+services (6)

- `avtoservis-celarc-crt` — hero and services point to identical new asset
- `elektro-instalacije-kovac` — hero and services point to identical new asset
- `marko-cerekovic` — hero and services point to identical new asset
- `napeljava-vodovodnih-centralnih` — hero and services point to identical new asset
- `pirnar-stanislav-avtoservis` — hero and services point to identical new asset
- `vodoinstalaterstvo-adi-dervis` — hero and services point to identical new asset

### Cross-demo heavy donors

- **23 uses** — `https://k1dgldwcgd9jslu2.public.blob.vercel-storage.com/clients/vodovo`… (21 demos; severity=notable)
- **18 uses** — `https://k1dgldwcgd9jslu2.public.blob.vercel-storage.com/clients/vzdrze`… (16 demos; severity=notable)
- **14 uses** — `https://k1dgldwcgd9jslu2.public.blob.vercel-storage.com/clients/vulkan`… (14 demos; severity=expected_qa_batch)
- **14 uses** — `https://k1dgldwcgd9jslu2.public.blob.vercel-storage.com/clients/studio`… (14 demos; severity=low)
- **11 uses** — `/clients/elektro-ivan-troha/hero.jpg`… (9 demos; severity=low)
- **11 uses** — `/clients/keramicarstvo-stanislav-radovicevic/services.jpg`… (11 demos; severity=expected_qa_batch)
- **11 uses** — `https://k1dgldwcgd9jslu2.public.blob.vercel-storage.com/clients/masaze`… (11 demos; severity=expected_qa_batch)
- **10 uses** — `https://k1dgldwcgd9jslu2.public.blob.vercel-storage.com/clients/cistil`… (10 demos; severity=low)

## Before → after

- Slots improved vs prior REPLACE problem: **120/121**
- Residual FAIL/REVIEW after swap: **16**
- Overall: replacements removed foreign signage / wrong-trade stock; remaining issues are mostly **within-demo duplicate heroes** and one **garden-section mismatch** (`vodvrt`).

## PASS (summary by new asset)

105 slots classified PASS.

- `pexels:32588555` — 19 slots (e.g. 3ici-install-vodovodne:services, 4mvodovodne-instalacije-matic:hero, aqua-install-milos:hero, kaplja-vodovodne-andrej:services…)
- `pexels:8986105` — 14 slots (e.g. 9fast-anze-soklic:hero, avtocenter-litija-zlato:hero, avtomehanika-koscak-primoz:hero, avtoservis-bojan-zagar:services…)
- `pexels:7750101` — 14 slots (e.g. frizerski-salon-branka:hero, frizerski-salon-edita:hero, frizerski-salon-karmen:hero, frizerski-salon-katja-2:hero…)
- `pexels:6870316` — 13 slots (e.g. qa-vulkanizerji-01-classic-split:services, qa-vulkanizerji-02-editorial-type:services, qa-vulkanizerji-03-photo-forward:services, qa-vulkanizerji-04-stats-trust:services…)
- `local:/clients/keramicarstvo-stanislav-radovicevic/services.jpg` — 11 slots (e.g. keramicarstvo-mubi-igor:services, qa-keramicarji-01-classic-split:services, qa-keramicarji-02-editorial-type:services, qa-keramicarji-03-photo-forward:services…)
- `pexels:16574941` — 11 slots (e.g. kozmeticni-salon-lila:hero, qa-kozmeticarji-01-classic-split:hero, qa-kozmeticarji-02-editorial-type:hero, qa-kozmeticarji-03-photo-forward:hero…)
- `pexels:6197122` — 9 slots (e.g. cistilni-servis-kristalcek:hero, cistilni-servis-luco:hero, cistilni-servis-zeljka:hero, cistilnica-pucelj-kamnik:hero…)
- `local:/clients/elektro-ivan-troha/hero.jpg` — 7 slots (e.g. elektro-kovac:services, elektro-veber-tone:hero, elektro-zagar-jan:hero, elektroinstalacije-saso-sodja:hero…)
- `pexels:7750144` — 4 slots (e.g. brivsko-frizerski-salon:services, frizerski-salon-renata-2:services, frizerstvo-marija-marija:services, havajana-frizersko-lepotilni:services)
- `pexels:37809576` — 2 slots (e.g. am-janc-avtokleparstvo:hero, don-avtokleparstvo-licarstvo:hero)
- `local:/clients/keramicarstvo-stanislav-radovicevic/hero.jpg` — 1 slots (e.g. keramicarstvo-zeljko-zeljko:hero)

## Method notes

- Donors re-inspected visually (local Read for JPG donors; KEEP validation from replacement batch for Blob donors).
- Each slot scored against demo industry, alt, and section purpose — not the photo in isolation.
- Full machine-readable rows: `audits/post-replacement-qa-report.json`.
