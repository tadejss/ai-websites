import type { ImagePoolCategoryId } from "@/images/image-pool-category";
import {
  CURATED_PALETTES,
  TEMPLATE_DEFAULT_PALETTE_ID,
  type CuratedPalette,
  type PaletteSuitabilityTag,
} from "@/theme/palettes/curated";
import type { TemplateId } from "./types";

const BEAUTY_CATEGORIES = new Set<ImagePoolCategoryId>([
  "frizerji",
  "kozmeticarji",
  "nohti-pedikura",
  "maserji-wellness",
]);

const TRADE_CATEGORIES = new Set<ImagePoolCategoryId>([
  "elektricarji",
  "vodovodarji-ogrevanje",
  "keramicarji",
  "slikopleskarji",
  "suhomontazerji",
  "mizarji-tesarji",
  "parketarji-talne-obloge",
  "gradbinci",
]);

const AUTO_CATEGORIES = new Set<ImagePoolCategoryId>([
  "vulkanizerji",
  "avtomehaniki",
  "avtokleparji-licarji",
]);

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function hasTag(
  palette: CuratedPalette,
  tags: PaletteSuitabilityTag[],
  field: "suitableFor" | "preferredFor" | "avoidFor",
): boolean {
  const list = palette[field];
  if (!list || list.length === 0) return false;
  return tags.some((tag) => list.includes(tag));
}

export function suitabilityTagsFor(input: {
  categoryId?: ImagePoolCategoryId | null;
  templateId?: TemplateId | null;
}): PaletteSuitabilityTag[] {
  const tags: PaletteSuitabilityTag[] = ["all"];
  if (input.templateId) {
    tags.push(input.templateId);
  }
  const categoryId = input.categoryId;
  if (!categoryId) {
    tags.push("services");
    return tags;
  }

  tags.push(categoryId);

  if (BEAUTY_CATEGORIES.has(categoryId)) {
    tags.push("beauty", "wellness");
  }
  if (TRADE_CATEGORIES.has(categoryId)) {
    tags.push("trade", "services");
  }
  if (AUTO_CATEGORIES.has(categoryId)) {
    tags.push("auto", "trade");
  }
  if (categoryId === "cistilni-servisi") {
    tags.push("cleaning", "services", "trade");
  }
  if (categoryId === "elektricarji") {
    tags.push("elektro");
  }
  if (categoryId === "gradbinci") {
    tags.push("construction");
  }
  if (categoryId === "mizarji-tesarji") {
    tags.push("mizar");
  }

  return tags;
}

/**
 * Deterministic palette assignment among the 14 curated palettes:
 * override → filter avoidFor → preferred → suitable → hash(slug).
 * Type template biases charcoal-signal.
 */
export function assignPalette(input: {
  slug: string;
  categoryId?: ImagePoolCategoryId | null;
  templateId?: TemplateId | null;
  override?: string | null;
}): string {
  if (input.override) {
    return input.override;
  }

  const tags = suitabilityTagsFor({
    categoryId: input.categoryId,
    templateId: input.templateId,
  });

  let candidates = CURATED_PALETTES.filter(
    (palette) => !hasTag(palette, tags, "avoidFor"),
  );

  if (candidates.length === 0) {
    candidates = [...CURATED_PALETTES];
  }

  const preferred = candidates.filter((palette) =>
    hasTag(palette, tags, "preferredFor"),
  );
  if (preferred.length > 0) {
    candidates = preferred;
  } else {
    const suitable = candidates.filter((palette) =>
      hasTag(palette, tags, "suitableFor"),
    );
    if (suitable.length > 0) {
      candidates = suitable;
    }
  }

  if (input.templateId === "type") {
    const charcoal = candidates.find((p) => p.id === "charcoal-signal");
    if (charcoal) {
      return charcoal.id;
    }
    return TEMPLATE_DEFAULT_PALETTE_ID.type;
  }

  if (candidates.length === 0) {
    return (
      TEMPLATE_DEFAULT_PALETTE_ID[input.templateId ?? "bento"] ?? "ink-coral"
    );
  }

  const index = stableHash(input.slug) % candidates.length;
  return candidates[index]!.id;
}
