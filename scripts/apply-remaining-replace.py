#!/usr/bin/env python3
"""Replace remaining single-use REPLACE assets by retargeting to KEEP donors.

Only updates site.json image metadata (no downloads, no new binaries).
Preserves demo alt unless it clearly contradicts the new photo trade.
"""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLIENTS = ROOT / "src/content/clients"

META_KEYS = [
    "src",
    "srcFallback",
    "width",
    "height",
    "format",
    "fallbackFormat",
    "provider",
    "sourceId",
    "sourceUrl",
    "photographer",
    "photographerUrl",
    "searchQuery",
    "attribution",
]


def load_site(slug: str) -> dict:
    return json.loads((CLIENTS / slug / "site.json").read_text())


def save_site(slug: str, site: dict) -> None:
    (CLIENTS / slug / "site.json").write_text(
        json.dumps(site, ensure_ascii=False, indent=2) + "\n"
    )


def donor_img(slug: str, slot: str) -> dict:
    return load_site(slug)["images"][slot]


def retarget(target, donor, new_alt=None):
    old = copy.deepcopy(target)
    for key in META_KEYS:
        if key in target and key not in donor:
            del target[key]
    for key in META_KEYS:
        if key in donor:
            target[key] = donor[key]
    if new_alt is not None:
        target["alt"] = new_alt
    elif "alt" not in target:
        target["alt"] = donor.get("alt") or ""
    return old


# (demo, slot, donor_slug, donor_slot, optional new_alt, reason)
PLAN = [
    (
        "mobilni-vulkanizer-radic",
        "hero",
        "vulkanizerstvo-mitja-kocevar",
        "hero",
        None,
        "REPLACE NA road lines → tire/garage KEEP",
    ),
    (
        "mobilni-vulkanizer-radic",
        "services",
        "vulkanizerstvo",
        "services",
        None,
        "REPLACE picnic/AI trunk → tire-change KEEP",
    ),
    (
        "dbf-vulkanizerstvo-hitri",
        "hero",
        "vulkanizerstvo-izdelava-kljucev",
        "hero",
        None,
        "REPLACE tuner meet/ZG plate → tire-rack KEEP",
    ),
    (
        "servis-industrijske-elektronike",
        "services",
        "elektro-ika-gregor",
        "services",
        None,
        "REPLACE commercial kitchen → electrical panel KEEP",
    ),
    (
        "elektro-kovac",
        "hero",
        "elvip-elektroinstalacije-podboj",
        "hero",
        None,
        "REPLACE nightlife portrait → electrician lighting-install KEEP",
    ),
    (
        "else-za-elektro",
        "services",
        "elektro-ika-gregor",
        "services",
        None,
        "REPLACE outboard motor workshop → fuse-box KEEP",
    ),
    (
        "elektro-poje-dejan",
        "hero",
        "elektro-ivan-troha",
        "hero",
        None,
        "REPLACE imperial/NA framing → EU distribution-board KEEP",
    ),
    (
        "gavro-elektro-hisniske",
        "services",
        "elektro-ika-gregor",
        "services",
        None,
        "REPLACE metal hinge → fuse-box KEEP",
    ),
    (
        "elmont-elektroservis-peter",
        "hero",
        "elektro-ivan-troha",
        "hero",
        None,
        "REPLACE caving scene → EU panel KEEP",
    ),
    (
        "elmont-elektroservis-peter",
        "services",
        "elvip-elektroinstalacije-podboj",
        "hero",
        None,
        "REPLACE tangled cables → lighting-install KEEP",
    ),
    (
        "elektrotehnika-puntar-slavko",
        "services",
        "elektro-ika-gregor",
        "services",
        None,
        "REPLACE air hose → fuse-box KEEP",
    ),
    (
        "popravilo-elektrotehnicnih-strojev",
        "hero",
        "elektro-ivan-troha",
        "hero",
        None,
        "REPLACE lifestyle portrait → electrical panel KEEP (appliance-service adjacent)",
    ),
    (
        "popravilo-elektrotehnicnih-strojev",
        "services",
        "elektro-ika-gregor",
        "services",
        None,
        "REPLACE BHARAT/imperial wrenches → fuse-box KEEP",
    ),
    (
        "amoris-keramicarstvo-zakljucna",
        "services",
        "keramicarstvo-stanislav-radovicevic",
        "services",
        None,
        "REPLACE ornate non-SI terrace tiling → subway-tile KEEP",
    ),
    (
        "keramicarstvo-ales-kucic",
        "services",
        "keramicarstvo-robi-breznikar",
        "hero",
        None,
        "REPLACE welding/metalwork → bathroom tile craftsmanship KEEP",
    ),
    (
        "umivalniki-dreams-obdelava",
        "services",
        "keramicarstvo-stanislav-radovicevic",
        "services",
        None,
        "REPLACE pottery workshop → tile backsplash KEEP",
    ),
    (
        "lepotni-studio-dama",
        "services",
        "lepotni-studio-aida",
        "services",
        None,
        "REPLACE forest landscape → e-file manicure beauty KEEP",
    ),
    (
        "frizerski-studio-soul",
        "hero",
        "havajana-frizersko-lepotilni",
        "hero",
        None,
        "REPLACE CGI armchair tropical → salon stations KEEP",
    ),
    (
        "frizerstvo-suzana-suzana",
        "services",
        "frizerski-salon-jelka",
        "services",
        None,
        "REPLACE cluttered informal shop → professional shears salon KEEP",
    ),
]


def main() -> None:
    changes = []
    for demo, slot, donor_slug, donor_slot, new_alt, reason in PLAN:
        site = load_site(demo)
        target = site["images"][slot]
        donor = donor_img(donor_slug, donor_slot)
        old = retarget(target, donor, new_alt=new_alt)
        other = "services" if slot == "hero" else "hero"
        other_src = site["images"][other].get("src")
        if target.get("src") == other_src:
            raise SystemExit(
                f"Would make identical hero/services on {demo}: {target.get('src')}"
            )
        save_site(demo, site)
        changes.append(
            {
                "demo": demo,
                "slot": slot,
                "reason": reason,
                "old": {
                    "src": old.get("src"),
                    "provider": old.get("provider"),
                    "sourceId": old.get("sourceId"),
                    "alt": old.get("alt"),
                },
                "new": {
                    "src": target.get("src"),
                    "provider": target.get("provider"),
                    "sourceId": target.get("sourceId"),
                    "alt": target.get("alt"),
                    "donor": f"{donor_slug}:{donor_slot}",
                },
            }
        )
        print(f"OK {demo}:{slot} → {donor_slug}:{donor_slot}")

    out = ROOT / "audits/remaining-replace-apply-log.json"
    out.write_text(
        json.dumps(
            {"count": len(changes), "changes": changes},
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )
    print(f"Wrote {out} ({len(changes)} slots)")


if __name__ == "__main__":
    main()
