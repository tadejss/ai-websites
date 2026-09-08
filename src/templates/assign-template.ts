import type { ImagePoolCategoryId } from "@/images/image-pool-category";
import { templateProfile } from "./category-template-profile";
import type { TemplateId } from "./types";

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export type ImageSignals = {
  /** True when a usable hero image is expected/available. */
  hasHeroImage: boolean;
  /** True when per-service imagery is available. */
  hasServiceImages: boolean;
};

/**
 * Deterministic template assignment:
 * 1. explicit override
 * 2. category profile + image suitability
 * 3. stable slug hash among remaining candidates
 */
export function assignTemplate(input: {
  slug: string;
  categoryId?: ImagePoolCategoryId | null;
  override?: TemplateId | null;
  imageSignals?: ImageSignals;
}): TemplateId {
  if (input.override) {
    return input.override;
  }

  const profile = templateProfile(input.categoryId);
  let candidates = [...profile.preferred];
  if (candidates.length === 0) {
    candidates = [...profile.allowed];
  }

  const signals = input.imageSignals ?? {
    hasHeroImage: true,
    hasServiceImages: true,
  };

  if (profile.imageHeavy && !signals.hasHeroImage) {
    candidates = candidates.filter((id) => id !== "floating");
    if (!candidates.includes("type") && profile.allowed.includes("type")) {
      candidates.push("type");
    }
    if (!candidates.includes("bento") && profile.allowed.includes("bento")) {
      candidates.push("bento");
    }
    if (!candidates.includes("outlined") && profile.allowed.includes("outlined")) {
      candidates.push("outlined");
    }
  }

  if (profile.typographyHeavy && signals.hasHeroImage === false) {
    if (!candidates.includes("type")) {
      candidates = ["type", ...candidates];
    }
  }

  candidates = candidates.filter((id) => profile.allowed.includes(id));
  if (candidates.length === 0) {
    candidates = [...profile.allowed];
  }
  if (candidates.length === 0) {
    return "bento";
  }

  const index = stableHash(input.slug) % candidates.length;
  return candidates[index]!;
}
