# Final demo image cleanup

Generated: 2026-09-07T07:44:44.160890+00:00

## REPLACE cleanup

| Metric | Count |
|---|---:|
| Original REPLACE assets (audit) | 42 |
| REPLACE assets no longer USED | 42 |
| REPLACE assets still USED | 0 |
| Final single-use batch slots retargeted | 19 |
| Final batch demos touched | 16 |

**Live USED slots with original REPLACE classification: 0**

All remaining clearly marked REPLACE assets were retargeted to existing KEEP donors (no new downloads).

## Live unique assets by original audit category

| Category | Unique assets still referenced |
|---|---:|
| KEEP | 128 |
| REVIEW | 49 |
| UNKNOWN | 122 |
| REPLACE | 0 |
| UNAUDITED | 0 |

## Remaining REVIEW (not manually resolved)

Subjective REVIEW items left in place per scope (49 unique live assets). Sample:

- `pexels:8985712` — 20 slots — score 62: Strong workshop scene but background poster appears Cyrillic
- `pexels:4374743` — 16 slots — score 58: Abstract ocean foam weak trade visual
- `pexels:37809549` — 15 slots — score 74: PDR strong but branded cap
- `pexels:1694980` — 11 slots — score 38: Abstract cracked wall texture weak trade
- `pexels:30499654` — 11 slots — score 55: Dark cluttered historic workshop
- `pexels:35546238` — 10 slots — score 62: Spa bed with third-party logo
- `pexels:8985924` — 9 slots — score 72: Mechanic B&W limits color brands
- `pexels:9245158` — 9 slots — score 58: Disinfection sprayer not routine cleaning
- `pexels:6196694` — 9 slots — score 65: Staged red overalls portrait
- `pexels:6196684` — 9 slots — score 68: Staged red overalls stock campaign
- `pexels:20381389` — 9 slots — score 74: English CAUTION wet-floor sign
- `pexels:6197114` — 9 slots — score 70: B&W glass cleaning editorial
- `pexels:32178008` — 6 slots — score 58: CGI apartment megacity skyline non-SI
- `pexels:8470881` — 5 slots — score 48: Non-EU plate format in body shop
- `pexels:30250199` — 4 slots — score 76: Spray-booth paintwork with Tyvek logo
- `pexels:8488035` — 4 slots — score 48: Messy unfinished ABS drain; weak marketing
- `pexels:37809581` — 4 slots — score 72: Polishing in athletic shorts/sneakers hobbyist look
- `pexels:5463582` — 3 slots — score 48: Outdoor AC not pure heating
- `pexels:24653480` — 3 slots — score 68: Product drip with LMI bottle branding
- `pexels:6560297` — 3 slots — score 42: English BODY & SPA towel

## Remaining UNKNOWN

122 unique live assets were never fully visually classified. Left unchanged.

## Pipeline rules (permanent)

Added `src/images/selection-rules.ts` and wired into generation/selection:

- SI/EU local-market constraints (signage, plates, outlets, infrastructure)
- Trade visual expectations per image-pool category
- People evaluated by commercial/cultural context, not demographics
- Section-purpose rules for hero vs services
- Pool queries get EU locale hints; market-violating queries are skipped/rejected
- Pool assignment refuses identical hero/services when a second eligible asset exists

## Artifacts

- `audits/remaining-replace-apply-log.json`
- `audits/final-image-cleanup-report.json`
- `audits/FINAL-IMAGE-CLEANUP-SUMMARY.md` (this file)
