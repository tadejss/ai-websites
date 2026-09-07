# Demo image library visual audit (Slovenia)

**Read-only.** No production assets, site.json, or cache were modified.

## Source of truth

- **Authoritative (USED):** `src/content/clients/{slug}/site.json` → `images.hero|services`
- **Cache artifact:** `data/image-asset-cache.json` (pool availability; not render source)
- **Binaries:** Vercel Blob and/or `public/clients` / `public/stock`

## Coverage

- Unique USED: **339** · UNUSED/CACHED: **4**
- Categories: `{'REPLACE': 42, 'REVIEW': 51, 'UNKNOWN': 122, 'KEEP': 128}`
- Classified: **221** · UNKNOWN: **122** (mostly single-demo leftovers)

## REPLACE

| score | demos | asset | reason | recommendation |
|---:|---:|---|---|---|
| 5 | 13 | `hash:8555282400b5f761` | Colored pencils wrong trade | Replace with trade-matched photo (not pencils) |
| 18 | 13 | `pexels:32588548` | Cyrillic ТЕХНОБЫТСЕРВИС overalls | Replace plumbing without Cyrillic |
| 20 | 11 | `hash:6c4ea29bfcfb03ec` | SE-Asian head-spa setup; Vietnamese GỪNG label | Replace with EU facial/spa treatment |
| 22 | 11 | `hash:ef30f78dabe1795f` | Beauty vanity English skincare for keramičarstvo | Replace with tiling |
| 35 | 10 | `pexels:28153670` | Informal outdoor night garage non-EU plate cues | Indoor EU bay |
| 28 | 9 | `pexels:7451918` | English CAUTION + DAIRY/DELI supermarket | Cleaning without English store signs |
| 35 | 9 | `pexels:9626877` | .FR domain on mechanic uniform | Uniform without foreign domains |
| 8 | 7 | `hash:31a9c52ff8409bbd` | Barbershop stock on elektro | Replace electrical |
| 35 | 6 | `hash:3915b81a23c3f9ce` | UK Type G wall outlet in salon | Replace with SI/EU Schuko salon |
| 22 | 4 | `hash:da9499e132f96eff` | Dutch Bussum/Naarden storefront text | Replace unmarked salon |
| 28 | 4 | `pexels:33388390` | Pressure washer in sandals wrong trade/OHS | Boiler/pipe with PPE |
| 18 | 4 | `pexels:7220892` | US round doorknob not plumbing | Pipe/heating install |
| 35 | 3 | `hash:284d71d703f510a2` | Russian Cyrillic wall text | Replace/crop Cyrillic |
| 28 | 3 | `pexels:1029635` | Outdoor gas-meter utility not residential plumbing | Indoor pipe/heating install |
| 40 | 2 | `hash:72a50d8763236882` | UK Type G outlets | EU-outlet salon |
| 25 | 2 | `hash:8e3f9c621f419fde` | Sewing atelier not salon | Salon interior |
| 18 | 2 | `hash:c254d8db5b5f1c6f` | Chaotic outdoor meters; non-EU labels | Replace neat EU metering |
| 20 | 2 | `pexels:10871585` | Indonesian K3 hardhat emblem | EU panel work |
| 5 | 2 | `pexels:26605672` | Houston TX tire shop English/Spanish signs | Unmarked EU vulcanizer |
| 12 | 2 | `pexels:33314764` | Lounge banquette not electrician work | Electrical install |
| 22 | 2 | `pexels:9139593` | US performance car show garage | EU hatchback bodywork |
| 8 | 1 | `hash:07363e93123cf01d` | AI trunk composite / picnic not vulcanizer | On-road tire service |
| 5 | 1 | `hash:24913374f7f594c3` | Commercial kitchen wrong trade | Electronics bench |
| 12 | 1 | `hash:2f95e44528e2d544` | Nightlife lifestyle portrait not elektro | Replace trade hero |
| 25 | 1 | `hash:40c45e597422eb61` | South Asian/ME ornate terrace tiling atypical for SI SME | Central-EU bathroom/kitchen tiling |
| 14 | 1 | `hash:418aa4686f69d77b` | Outboard motor workshop not elektro | Electrical install |
| 30 | 1 | `hash:425069b27dc5f23b` | Imperial measurements NA framing | Replace with metric/EU electrical |
| 25 | 1 | `hash:447c1cdb6783a99d` | Tuner meet not vulcanizing; ZG plate | Replace with tire service |
| 10 | 1 | `hash:5dea952118321630` | Forest landscape no beauty | Treatment/salon |
| 12 | 1 | `hash:80be6e5472d750ac` | Metal hinge not electrical | Household electrical |
| 12 | 1 | `hash:81b7772e7755926f` | Lifestyle portrait no repair cues | Machine repair workshop |
| 28 | 1 | `hash:8859e8a75b7064ec` | Metaphorical wrenches BHARAT/imperial | Real electromechanical repair |
| 15 | 1 | `hash:9c400fab8b4b023c` | Welding/metalwork not tiling | Swap for tiling install |
| 22 | 1 | `hash:b396ba6b69981984` | CGI armchair tropical plants not salon | Salon station |
| 10 | 1 | `hash:b9c5db74d1cb607e` | Caving scene zero elektro | Panel/wiring |
| 22 | 1 | `hash:cd3bc9856376ff15` | Informal cluttered shop with security gate | Replace with tidy salon |
| 20 | 1 | `hash:e26fd1f51fd0808b` | Tangled cables unprofessional | Clean electrical work |
| 30 | 1 | `hash:e31028865f0af9e5` | Pottery workshop not sink fabrication | Sink machining/install |
| 18 | 1 | `hash:f59f973255b4f310` | Air hose not electrical | Panels/wiring |
| 18 | 1 | `hash:f8dbc96ab16496d5` | NA double yellow road lines; no tire service | SI roadside tire service |
| 25 | 0 | `pexels:18110372` | UNUSED pool: East Asian striped construction tarp | Do not use SI construction |
| 15 | 0 | `pexels:38749872` | UNUSED pool: Cyrillic shirt + flip-flops on roof | Do not use |

## REVIEW

| score | demos | asset | reason | recommendation |
|---:|---:|---|---|---|
| 62 | 20 | `pexels:8985712` | Strong workshop scene but background poster appears Cyrillic | Crop poster or replace |
| 58 | 16 | `pexels:4374743` | Abstract ocean foam weak trade visual | Atmosphere only or replace |
| 74 | 15 | `pexels:37809549` | PDR strong but branded cap | Crop branding |
| 46 | 13 | `hash:ee3cc120088b931d` | EXIT + palm | Replace |
| 38 | 11 | `pexels:1694980` | Abstract cracked wall texture weak trade | Decorative only |
| 55 | 11 | `pexels:30499654` | Dark cluttered historic workshop | Brighter workshop |
| 62 | 10 | `pexels:35546238` | Spa bed with third-party logo | Crop logo |
| 74 | 9 | `pexels:20381389` | English CAUTION wet-floor sign | Crop sign |
| 68 | 9 | `pexels:6196684` | Staged red overalls stock campaign | Prefer candid action |
| 65 | 9 | `pexels:6196694` | Staged red overalls portrait | Working-in-context |
| 70 | 9 | `pexels:6197114` | B&W glass cleaning editorial | Prefer color |
| 72 | 9 | `pexels:8985924` | Mechanic B&W limits color brands | Prefer color |
| 58 | 9 | `pexels:9245158` | Disinfection sprayer not routine cleaning | Use only disinfection pages |
| 58 | 6 | `pexels:32178008` | CGI apartment megacity skyline non-SI | SI-plausible interior |
| 48 | 5 | `pexels:8470881` | Non-EU plate format in body shop | Crop plate |
| 76 | 4 | `pexels:30250199` | Spray-booth paintwork with Tyvek logo | Crop logo or unbranded PPE |
| 72 | 4 | `pexels:37809581` | Polishing in athletic shorts/sneakers hobbyist look | Prefer coveralls |
| 48 | 4 | `pexels:8488035` | Messy unfinished ABS drain; weak marketing | Prefer clean EU pipe install |
| 58 | 3 | `hash:30b9377356f06073` | NA Type-B outlets in bathroom | Crop outlets or replace |
| 55 | 3 | `hash:4b05466be788b282` | Roofing tiles not wall/floor keramičarstvo | Bathroom/floor tiling |
| 44 | 3 | `pexels:12142829` | Rough exterior PVC poor hero quality | Before-state only or replace |
| 68 | 3 | `pexels:24653480` | Product drip with LMI bottle branding | Crop logo |
| 48 | 3 | `pexels:5463582` | Outdoor AC not pure heating | Boiler-centric if needed |
| 42 | 3 | `pexels:6560297` | English BODY & SPA towel | Crop towel text |
| 48 | 2 | `hash:103769a408860768` | Generic DIY tools | Prefer electrical kit |
| 60 | 2 | `hash:5ab17493d6c7d986` | Abstract tile light/shadow | Clearer finished room |
| 65 | 2 | `hash:648dbe448c0d9e00` | Dior magazine prop stocky | Prefer salon work |
| 70 | 2 | `hash:fd76b93f17688c92` | Makeup more than hairdressing | Cut/color shot |
| 55 | 2 | `pexels:28704177` | Turkish tulip tea glass in cobbler shop | Crop tea glass |
| 62 | 2 | `pexels:34286675` | Locksmith with English DoorAlex pack | Crop foreign packs |
| 58 | 2 | `pexels:37229315` | Cucumber spa cliché dated | Contemporary facial |
| 55 | 1 | `hash:0fafd5d302ef5309` | Phone PCB weak for industrial electronics | Industrial boards |
| 72 | 1 | `hash:12ec17d8bb458841` | Generic corporate high-five stock | Prefer real owner photo |
| 58 | 1 | `hash:138108c5570e8791` | Abstract industrial toggle; poor residential elektro storytelling | Use consumer unit/Schuko |
| 50 | 1 | `hash:15bee4d04b501bf6` | km/h gauge abstract; weak tire signal | Prefer tires/rims |
| 42 | 1 | `hash:3a90587fc9a801e1` | Generic tools; weak elektro | Swap for sockets/panel |
| 48 | 1 | `hash:44db1c8fd48cc51d` | US Vagaro POS + Christmas | Year-round EU desk |
| 32 | 1 | `hash:6760420c568c66ff` | Russian Vogue Cyrillic cover | Crop magazine |
| 42 | 1 | `hash:6c68f3684b34cbfb` | Abstract lighting ceiling weak elektro | Prefer switchboards |
| 42 | 1 | `hash:72b6e250a43fc975` | Lifestyle interior weak elektro | Prefer install detail |
| 55 | 1 | `hash:a04f76da92da8746` | Artistic fluorescent metaphor; weak elektro usefulness | Prefer wiring/panel shot |
| 72 | 1 | `hash:a0ac98cae76207e6` | English FACE CREAM prop | Prefer treatment room |
| 68 | 1 | `hash:af211a6403558555` | Made in Australia soap label | Crop label |
| 40 | 1 | `hash:b778c8f0c17b4b61` | Cajón portrait weak salon | Hair work |
| 52 | 1 | `hash:c370b163f424b722` | Cluttered electronics bench B&W | Prefer cleaner workshop |
| 62 | 1 | `hash:dde9566dcabd8472` | English Hello Gorgeous neon | Crop/replace neon |
| 58 | 1 | `hash:f209130653a92fc3` | Flat stone steps weak showcase | Clearer tile project |
| 50 | 1 | `hash:f26e7951da0e4e7a` | Dated retro bathroom | Contemporary tiling |
| 58 | 1 | `hash:f70c8cc46c1b1cd6` | Detailing wrap more than tires | Tire equipment |
| 45 | 0 | `pexels:17866923` | UNUSED pool: Iberian blue mosaic weak for SI tile demos | Do not promote to demos |
| 50 | 0 | `pexels:34670929` | UNUSED pool: AKYAR logo on hi-vis | Avoid or crop logo |

## High-impact shared (≥5 demos, REPLACE/REVIEW)

- **REPLACE** `hash:8555282400b5f761` ×13: Colored pencils wrong trade → *Replace with trade-matched photo (not pencils)*
- **REPLACE** `pexels:32588548` ×13: Cyrillic ТЕХНОБЫТСЕРВИС overalls → *Replace plumbing without Cyrillic*
- **REPLACE** `hash:6c4ea29bfcfb03ec` ×11: SE-Asian head-spa setup; Vietnamese GỪNG label → *Replace with EU facial/spa treatment*
- **REPLACE** `hash:ef30f78dabe1795f` ×11: Beauty vanity English skincare for keramičarstvo → *Replace with tiling*
- **REPLACE** `pexels:28153670` ×10: Informal outdoor night garage non-EU plate cues → *Indoor EU bay*
- **REPLACE** `pexels:7451918` ×9: English CAUTION + DAIRY/DELI supermarket → *Cleaning without English store signs*
- **REPLACE** `pexels:9626877` ×9: .FR domain on mechanic uniform → *Uniform without foreign domains*
- **REPLACE** `hash:31a9c52ff8409bbd` ×7: Barbershop stock on elektro → *Replace electrical*
- **REPLACE** `hash:3915b81a23c3f9ce` ×6: UK Type G wall outlet in salon → *Replace with SI/EU Schuko salon*
- **REVIEW** `pexels:8985712` ×20: Strong workshop scene but background poster appears Cyrillic → *Crop poster or replace*
- **REVIEW** `pexels:4374743` ×16: Abstract ocean foam weak trade visual → *Atmosphere only or replace*
- **REVIEW** `pexels:37809549` ×15: PDR strong but branded cap → *Crop branding*
- **REVIEW** `hash:ee3cc120088b931d` ×13: EXIT + palm → *Replace*
- **REVIEW** `pexels:1694980` ×11: Abstract cracked wall texture weak trade → *Decorative only*
- **REVIEW** `pexels:30499654` ×11: Dark cluttered historic workshop → *Brighter workshop*
- **REVIEW** `pexels:35546238` ×10: Spa bed with third-party logo → *Crop logo*
- **REVIEW** `pexels:20381389` ×9: English CAUTION wet-floor sign → *Crop sign*
- **REVIEW** `pexels:6196684` ×9: Staged red overalls stock campaign → *Prefer candid action*
- **REVIEW** `pexels:6196694` ×9: Staged red overalls portrait → *Working-in-context*
- **REVIEW** `pexels:6197114` ×9: B&W glass cleaning editorial → *Prefer color*
- **REVIEW** `pexels:8985924` ×9: Mechanic B&W limits color brands → *Prefer color*
- **REVIEW** `pexels:9245158` ×9: Disinfection sprayer not routine cleaning → *Use only disinfection pages*
- **REVIEW** `pexels:32178008` ×6: CGI apartment megacity skyline non-SI → *SI-plausible interior*
- **REVIEW** `pexels:8470881` ×5: Non-EU plate format in body shop → *Crop plate*

## Replacement pool (not applied)

### `hash:8555282400b5f761` ×13 **multi-demo**
- Why: Colored pencils wrong trade
- Better type: Replace with trade-matched photo (not pencils)
- Must satisfy: Match the actual Slovenian trade shown on the demo

### `pexels:32588548` ×13 **multi-demo**
- Why: Cyrillic ТЕХНОБЫТСЕРВИС overalls
- Better type: Replace plumbing without Cyrillic
- Must satisfy: No foreign-language commercial text (prefer unmarked or SI/EU Latin)

### `hash:6c4ea29bfcfb03ec` ×11 **multi-demo**
- Why: SE-Asian head-spa setup; Vietnamese GỪNG label
- Better type: Replace with EU facial/spa treatment
- Must satisfy: No foreign-language commercial text (prefer unmarked or SI/EU Latin)

### `hash:ef30f78dabe1795f` ×11 **multi-demo**
- Why: Beauty vanity English skincare for keramičarstvo
- Better type: Replace with tiling
- Must satisfy: No foreign-language commercial text (prefer unmarked or SI/EU Latin)

### `pexels:28153670` ×10 **multi-demo**
- Why: Informal outdoor night garage non-EU plate cues
- Better type: Indoor EU bay
- Must satisfy: Central-European / Slovenian-plausible setting; No foreign license plates (or fully cropped)

### `pexels:7451918` ×9 **multi-demo**
- Why: English CAUTION + DAIRY/DELI supermarket
- Better type: Cleaning without English store signs
- Must satisfy: No foreign-language commercial text (prefer unmarked or SI/EU Latin)

### `pexels:9626877` ×9 **multi-demo**
- Why: .FR domain on mechanic uniform
- Better type: Uniform without foreign domains
- Must satisfy: No foreign-language commercial text (prefer unmarked or SI/EU Latin)

### `hash:31a9c52ff8409bbd` ×7 **multi-demo**
- Why: Barbershop stock on elektro
- Better type: Replace electrical
- Must satisfy: Match the actual Slovenian trade shown on the demo

### `hash:3915b81a23c3f9ce` ×6 **multi-demo**
- Why: UK Type G wall outlet in salon
- Better type: Replace with SI/EU Schuko salon
- Must satisfy: EU Schuko (Type C/F) outlets if fixtures visible

### `hash:da9499e132f96eff` ×4 **multi-demo**
- Why: Dutch Bussum/Naarden storefront text
- Better type: Replace unmarked salon
- Must satisfy: No foreign-language commercial text (prefer unmarked or SI/EU Latin)

### `pexels:33388390` ×4 **multi-demo**
- Why: Pressure washer in sandals wrong trade/OHS
- Better type: Boiler/pipe with PPE
- Must satisfy: Match the actual Slovenian trade shown on the demo

### `pexels:7220892` ×4 **multi-demo**
- Why: US round doorknob not plumbing
- Better type: Pipe/heating install
- Must satisfy: Match the actual Slovenian trade shown on the demo

### `hash:284d71d703f510a2` ×3 **multi-demo**
- Why: Russian Cyrillic wall text
- Better type: Replace/crop Cyrillic
- Must satisfy: No foreign-language commercial text (prefer unmarked or SI/EU Latin)

### `pexels:1029635` ×3 **multi-demo**
- Why: Outdoor gas-meter utility not residential plumbing
- Better type: Indoor pipe/heating install
- Must satisfy: Match the actual Slovenian trade shown on the demo

### `hash:72a50d8763236882` ×2 **multi-demo**
- Why: UK Type G outlets
- Better type: EU-outlet salon
- Must satisfy: EU Schuko (Type C/F) outlets if fixtures visible

### `hash:8e3f9c621f419fde` ×2 **multi-demo**
- Why: Sewing atelier not salon
- Better type: Salon interior
- Must satisfy: Match the actual Slovenian trade shown on the demo

### `hash:c254d8db5b5f1c6f` ×2 **multi-demo**
- Why: Chaotic outdoor meters; non-EU labels
- Better type: Replace neat EU metering
- Must satisfy: Central-European / Slovenian-plausible setting

### `pexels:10871585` ×2 **multi-demo**
- Why: Indonesian K3 hardhat emblem
- Better type: EU panel work
- Must satisfy: No foreign-language commercial text (prefer unmarked or SI/EU Latin); Central-European / Slovenian-plausible setting

### `pexels:26605672` ×2 **multi-demo**
- Why: Houston TX tire shop English/Spanish signs
- Better type: Unmarked EU vulcanizer
- Must satisfy: No foreign-language commercial text (prefer unmarked or SI/EU Latin); Central-European / Slovenian-plausible setting

### `pexels:33314764` ×2 **multi-demo**
- Why: Lounge banquette not electrician work
- Better type: Electrical install
- Must satisfy: Match the actual Slovenian trade shown on the demo

### `pexels:9139593` ×2 **multi-demo**
- Why: US performance car show garage
- Better type: EU hatchback bodywork
- Must satisfy: Culturally neutral EU/SI trade photography matching the demo industry

### `hash:07363e93123cf01d` ×1
- Why: AI trunk composite / picnic not vulcanizer
- Better type: On-road tire service
- Must satisfy: Culturally neutral EU/SI trade photography matching the demo industry

### `hash:24913374f7f594c3` ×1
- Why: Commercial kitchen wrong trade
- Better type: Electronics bench
- Must satisfy: Match the actual Slovenian trade shown on the demo

### `hash:2f95e44528e2d544` ×1
- Why: Nightlife lifestyle portrait not elektro
- Better type: Replace trade hero
- Must satisfy: Culturally neutral EU/SI trade photography matching the demo industry

### `hash:40c45e597422eb61` ×1
- Why: South Asian/ME ornate terrace tiling atypical for SI SME
- Better type: Central-EU bathroom/kitchen tiling
- Must satisfy: Culturally neutral EU/SI trade photography matching the demo industry

### `hash:418aa4686f69d77b` ×1
- Why: Outboard motor workshop not elektro
- Better type: Electrical install
- Must satisfy: Match the actual Slovenian trade shown on the demo

### `hash:425069b27dc5f23b` ×1
- Why: Imperial measurements NA framing
- Better type: Replace with metric/EU electrical
- Must satisfy: Culturally neutral EU/SI trade photography matching the demo industry

### `hash:447c1cdb6783a99d` ×1
- Why: Tuner meet not vulcanizing; ZG plate
- Better type: Replace with tire service
- Must satisfy: No foreign license plates (or fully cropped)

### `hash:5dea952118321630` ×1
- Why: Forest landscape no beauty
- Better type: Treatment/salon
- Must satisfy: Match the actual Slovenian trade shown on the demo

### `hash:80be6e5472d750ac` ×1
- Why: Metal hinge not electrical
- Better type: Household electrical
- Must satisfy: Match the actual Slovenian trade shown on the demo

### `hash:81b7772e7755926f` ×1
- Why: Lifestyle portrait no repair cues
- Better type: Machine repair workshop
- Must satisfy: Culturally neutral EU/SI trade photography matching the demo industry

### `hash:8859e8a75b7064ec` ×1
- Why: Metaphorical wrenches BHARAT/imperial
- Better type: Real electromechanical repair
- Must satisfy: Culturally neutral EU/SI trade photography matching the demo industry

### `hash:9c400fab8b4b023c` ×1
- Why: Welding/metalwork not tiling
- Better type: Swap for tiling install
- Must satisfy: Culturally neutral EU/SI trade photography matching the demo industry

### `hash:b396ba6b69981984` ×1
- Why: CGI armchair tropical plants not salon
- Better type: Salon station
- Must satisfy: Central-European / Slovenian-plausible setting

### `hash:b9c5db74d1cb607e` ×1
- Why: Caving scene zero elektro
- Better type: Panel/wiring
- Must satisfy: Match the actual Slovenian trade shown on the demo

### `hash:cd3bc9856376ff15` ×1
- Why: Informal cluttered shop with security gate
- Better type: Replace with tidy salon
- Must satisfy: Culturally neutral EU/SI trade photography matching the demo industry

### `hash:e26fd1f51fd0808b` ×1
- Why: Tangled cables unprofessional
- Better type: Clean electrical work
- Must satisfy: Culturally neutral EU/SI trade photography matching the demo industry

### `hash:e31028865f0af9e5` ×1
- Why: Pottery workshop not sink fabrication
- Better type: Sink machining/install
- Must satisfy: Match the actual Slovenian trade shown on the demo

### `hash:f59f973255b4f310` ×1
- Why: Air hose not electrical
- Better type: Panels/wiring
- Must satisfy: Match the actual Slovenian trade shown on the demo

### `hash:f8dbc96ab16496d5` ×1
- Why: NA double yellow road lines; no tire service
- Better type: SI roadside tire service
- Must satisfy: Culturally neutral EU/SI trade photography matching the demo industry

### `pexels:18110372` ×0
- Why: UNUSED pool: East Asian striped construction tarp
- Better type: Do not use SI construction
- Must satisfy: Central-European / Slovenian-plausible setting

### `pexels:38749872` ×0
- Why: UNUSED pool: Cyrillic shirt + flip-flops on roof
- Better type: Do not use
- Must satisfy: No foreign-language commercial text (prefer unmarked or SI/EU Latin)


Full tables: `audits/demo-image-visual-audit-report.csv` / `.json`
