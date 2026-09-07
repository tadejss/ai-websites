#!/usr/bin/env python3
"""Apply high-impact REPLACE swaps by reusing existing KEEP donor image entries.

Only updates site.json image metadata to point at already-delivered canonical
assets (no re-download, no new binaries). Preserves each demo's alt text.
"""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN = json.loads((ROOT / "audits/replacement-plan.json").read_text())
IMPACT = json.loads((ROOT / "audits/replacement-impact-map.json").read_text())

# Map reuseCacheKey → find first site.json image with that provider:sourceId
# Map reuseLocalPath → public URL path + minimal metadata


def find_pexels_donor(cache_key):
    provider, source_id = cache_key.split(":", 1)
    for site_path in (ROOT / "src/content/clients").glob("*/site.json"):
        data = json.loads(site_path.read_text())
        for slot, img in (data.get("images") or {}).items():
            if not isinstance(img, dict):
                continue
            if img.get("provider") == provider and str(img.get("sourceId")) == source_id:
                return {
                    "donor_slug": site_path.parent.name,
                    "donor_slot": slot,
                    "img": img,
                }
    raise SystemExit(f"No donor site.json found for {cache_key}")


def local_donor_image(local_path, search_query):
    # local_path like public/clients/foo/hero.jpg → /clients/foo/hero.jpg
    rel = local_path
    if rel.startswith("public/"):
        rel = rel[len("public/") :]
    url = "/" + rel.lstrip("/")
    abs_path = ROOT / "public" / rel
    if not abs_path.exists():
        raise SystemExit(f"Missing local donor: {abs_path}")
    return {
        "src": url,
        "srcFallback": url,
        "alt": "",
        "searchQuery": search_query,
        # Keep format hints generic for jpg legacy
        "format": abs_path.suffix.lstrip(".").lower() or "jpg",
        "fallbackFormat": abs_path.suffix.lstrip(".").lower() or "jpg",
    }


def matches_group(slug, group):
    if group.get("slugs") and slug in group["slugs"]:
        return True
    prefix = group.get("slugPrefix")
    if prefix and slug.startswith(prefix):
        return True
    return False


def resolve_groups(job):
    if job.get("groups"):
        return job["groups"]
    return [
        {
            "reuseCacheKey": job.get("reuseCacheKey"),
            "reuseLocalPath": job.get("reuseLocalPath"),
            "searchQuery": job.get("searchQuery"),
        }
    ]


def build_replacement_img(group, prev):
    search_query = group.get("searchQuery") or prev.get("searchQuery") or ""
    if group.get("reuseCacheKey"):
        donor = find_pexels_donor(group["reuseCacheKey"])
        img = copy.deepcopy(donor["img"])
        img["alt"] = prev.get("alt") or img.get("alt") or ""
        if search_query:
            img["searchQuery"] = search_query
        img["_donor"] = f"{donor['donor_slug']}:{donor['donor_slot']}"
        return img
    if group.get("reuseLocalPath"):
        img = local_donor_image(group["reuseLocalPath"], search_query)
        img["alt"] = prev.get("alt") or ""
        img["_donor"] = group["reuseLocalPath"]
        return img
    raise SystemExit(f"Group missing reuse source: {group}")


def main():
    log = []
    updated = 0
    skipped = 0

    for job in PLAN["jobs"]:
        old_key = job["oldKey"]
        uses = IMPACT.get(old_key, {}).get("uses", [])
        groups = resolve_groups(job)

        for use in uses:
            slug = use["slug"]
            slot = use["slot"]
            if len(groups) == 1 and not groups[0].get("slugs") and not groups[0].get("slugPrefix"):
                group = groups[0]
            else:
                group = next((g for g in groups if matches_group(slug, g)), None)
            if not group:
                print(f"SKIP no-group {old_key} → {slug}:{slot}")
                skipped += 1
                continue

            site_path = ROOT / "src/content/clients" / slug / "site.json"
            if not site_path.exists():
                print(f"SKIP missing {slug}")
                skipped += 1
                continue

            site = json.loads(site_path.read_text())
            prev = (site.get("images") or {}).get(slot)
            if not isinstance(prev, dict):
                print(f"SKIP no-slot {slug}:{slot}")
                skipped += 1
                continue

            next_img = build_replacement_img(group, prev)
            donor = next_img.pop("_donor", None)
            site.setdefault("images", {})[slot] = next_img
            site_path.write_text(json.dumps(site, ensure_ascii=False, indent=2) + "\n")
            updated += 1
            entry = {
                "oldKey": old_key,
                "slug": slug,
                "slot": slot,
                "donor": donor,
                "newSrc": next_img.get("src"),
                "sourceId": next_img.get("sourceId"),
                "provider": next_img.get("provider"),
            }
            log.append(entry)
            print(f"OK {slug}:{slot} ← {donor}")

    out = ROOT / "audits/replacement-apply-log.json"
    out.write_text(json.dumps({"updated": updated, "skipped": skipped, "log": log}, ensure_ascii=False, indent=2) + "\n")
    print(f"\nDone updated={updated} skipped={skipped} log={out}")


if __name__ == "__main__":
    main()
