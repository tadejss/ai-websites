# High-impact REPLACE → KEEP donor retarget

**Scope:** Only audit `REPLACE` assets with ≥2 demos (plus multi-trade splits).  
**Out of scope:** `REVIEW`, `UNKNOWN`, `demos==1` REPLACE, UNUSED cache entries.

## Method
Retargeted `site.json` image slots to **existing KEEP donor assets** already delivered on Blob or `public/clients`.  
No new stock downloads, no binary regeneration, no cache mutations.

## Results
- **121 slots** updated across **114** `site.json` files
- **0** stale old keys remaining in updated slots
- **0** missing local `src` paths

## Canonical mappings (high level)

| Old (REPLACE) | New (KEEP donor) | Demos |
|---|---|---:|
| `pexels:32588548` Cyrillic overalls | `pexels:32588555` heating/HVAC | 13 |
| `hash:…pencils` | tire `6870316` / elektro panel (split) | 13 |
| `hash:…lila head-spa` | `pexels:16574941` facial mask | 11 |
| `hash:…beauty vanity on tiles` | keramik tile services JPG | 11 |
| `pexels:28153670` outdoor garage | `8986105` / elektro panel (split) | 10 |
| `pexels:7451918` English supermarket | `pexels:6197122` window cleaning | 9 |
| `pexels:9626877` `.FR` uniform | `pexels:8986105` lift bay | 9 |
| `hash:…barber on wrong trades` | trade-split (elektro/frizer/keramik/tire) | 7 |
| UK Type G / Dutch storefront / Cyrillic salon | `7750101` / `7750144` salon interiors | 6+4+3+2 |
| Houston tire / US Viper / doorknob / sandals / gas meters | tire / PDR / heating KEEP donors | 2–4 |

## Artifacts
- `audits/replacement-plan.json` — briefs + donor specs
- `audits/replacement-impact-map.json` — slug/slot/industry map
- `audits/replacement-apply-log.json` — per-slot apply log
- `audits/replacement-gallery.html` — after gallery
- `audits/replacement-regression.json` — regression summary
- `scripts/apply-high-impact-replacements.py` — apply script

## Git
Only expected changes: modified client `site.json` files + new audit/script artifacts.  
No `public/` binary edits, no `image-asset-cache.json` changes.
