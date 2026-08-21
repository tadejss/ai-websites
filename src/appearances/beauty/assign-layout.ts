import type {
  BeautyLayoutProfileId,
  SiteLayout,
} from "@/content/types/site";

const PROFILE_IDS: BeautyLayoutProfileId[] = [
  "classic",
  "media-left",
  "copy-heavy",
  "services-first-visual",
  "airy",
];

const PROFILE_LAYOUTS: Record<BeautyLayoutProfileId, Omit<SiteLayout, "profileId">> =
  {
    classic: {
      heroImageSide: "right",
      servicesImageSide: "right",
      heroRatio: "5050",
      benefitsMode: "default",
    },
    "media-left": {
      heroImageSide: "left",
      servicesImageSide: "left",
      heroRatio: "5050",
      benefitsMode: "default",
    },
    "copy-heavy": {
      heroImageSide: "right",
      servicesImageSide: "none",
      heroRatio: "6040",
      benefitsMode: "default",
    },
    "services-first-visual": {
      heroImageSide: "right",
      servicesImageSide: "none",
      heroRatio: "5050",
      benefitsMode: "visual",
    },
    airy: {
      heroImageSide: "none",
      servicesImageSide: "left",
      heroRatio: "full-copy",
      benefitsMode: "default",
    },
  };

function hashString(value: string): number {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return Math.abs(hash);
}

/** Deterministic beauty layout profile from slug (stable across regenerations). */
export function assignBeautyLayout(slug: string): SiteLayout {
  const profileId = PROFILE_IDS[hashString(slug) % PROFILE_IDS.length];
  const profile = PROFILE_LAYOUTS[profileId];

  return {
    profileId,
    ...profile,
  };
}

/** Resolve layout with classic fallback for sites without an assigned profile. */
export function resolveBeautyLayout(layout?: SiteLayout): SiteLayout {
  if (!layout?.profileId) {
    return {
      profileId: "classic",
      ...PROFILE_LAYOUTS.classic,
    };
  }

  const defaults = PROFILE_LAYOUTS[layout.profileId] ?? PROFILE_LAYOUTS.classic;

  return {
    profileId: layout.profileId,
    heroImageSide: layout.heroImageSide ?? defaults.heroImageSide,
    servicesImageSide: layout.servicesImageSide ?? defaults.servicesImageSide,
    heroRatio: layout.heroRatio ?? defaults.heroRatio,
    benefitsMode: layout.benefitsMode ?? defaults.benefitsMode,
  };
}
