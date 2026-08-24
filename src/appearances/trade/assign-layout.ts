import type { TradeAppearanceId } from "@/appearances/types";
import type {
  SiteLayout,
  TradeLayoutProfileId,
} from "@/content/types/site";

type LayoutKnobs = Omit<SiteLayout, "profileId">;

const PHOTO_FORWARD: LayoutKnobs = {
  heroImageSide: "none",
  servicesImageSide: "right",
  heroRatio: "full-copy",
  benefitsMode: "default",
  heroAtmosphere: "photo",
  sectionRule: "line",
  cardStyle: "bordered",
};

const SHARED_PROFILES: Record<
  Extract<
    TradeLayoutProfileId,
    | "classic"
    | "media-left"
    | "copy-heavy"
    | "services-first-visual"
    | "airy"
  >,
  LayoutKnobs
> = {
  classic: {
    heroImageSide: "right",
    servicesImageSide: "right",
    heroRatio: "5050",
    benefitsMode: "default",
    heroAtmosphere: "grid",
    sectionRule: "line",
    cardStyle: "bordered",
  },
  "media-left": {
    heroImageSide: "left",
    servicesImageSide: "left",
    heroRatio: "5050",
    benefitsMode: "default",
    heroAtmosphere: "wash",
    sectionRule: "line",
    cardStyle: "bordered",
  },
  "copy-heavy": {
    heroImageSide: "right",
    servicesImageSide: "none",
    heroRatio: "6040",
    benefitsMode: "default",
    heroAtmosphere: "plain",
    sectionRule: "none",
    cardStyle: "soft",
  },
  "services-first-visual": {
    heroImageSide: "right",
    servicesImageSide: "none",
    heroRatio: "5050",
    benefitsMode: "visual",
    heroAtmosphere: "wash",
    sectionRule: "none",
    cardStyle: "bordered",
  },
  airy: {
    heroImageSide: "none",
    servicesImageSide: "left",
    heroRatio: "full-copy",
    benefitsMode: "default",
    heroAtmosphere: "plain",
    sectionRule: "none",
    cardStyle: "soft",
  },
};

const TRADE_ONLY_PROFILES: Record<
  Extract<
    TradeLayoutProfileId,
    "stats-forward" | "image-led" | "calm-visual" | "photo-forward"
  >,
  LayoutKnobs
> = {
  "stats-forward": {
    heroImageSide: "none",
    servicesImageSide: "right",
    heroRatio: "full-copy",
    benefitsMode: "default",
    heroAtmosphere: "plain",
    sectionRule: "line",
    cardStyle: "bordered",
  },
  "image-led": {
    heroImageSide: "left",
    servicesImageSide: "right",
    heroRatio: "5050",
    benefitsMode: "default",
    heroAtmosphere: "grid",
    sectionRule: "none",
    cardStyle: "soft",
  },
  "calm-visual": {
    heroImageSide: "none",
    servicesImageSide: "left",
    heroRatio: "full-copy",
    benefitsMode: "visual",
    heroAtmosphere: "plain",
    sectionRule: "none",
    cardStyle: "soft",
  },
  "photo-forward": PHOTO_FORWARD,
};

const ALL_PROFILES: Record<TradeLayoutProfileId, LayoutKnobs> = {
  ...SHARED_PROFILES,
  ...TRADE_ONLY_PROFILES,
};

const PROFILES_BY_APPEARANCE: Record<
  TradeAppearanceId,
  TradeLayoutProfileId[]
> = {
  elektro: [
    "classic",
    "media-left",
    "copy-heavy",
    "stats-forward",
    "photo-forward",
  ],
  construction: [
    "classic",
    "media-left",
    "copy-heavy",
    "image-led",
    "photo-forward",
  ],
  cleaning: [
    "classic",
    "airy",
    "copy-heavy",
    "media-left",
    "photo-forward",
  ],
  health: ["classic", "airy", "media-left", "copy-heavy", "photo-forward"],
  auto: [
    "classic",
    "media-left",
    "copy-heavy",
    "stats-forward",
    "photo-forward",
  ],
};

function hashString(value: string): number {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return Math.abs(hash);
}

/** Deterministic trade layout profile from slug (stable across regenerations). */
export function assignTradeLayout(
  appearance: TradeAppearanceId,
  slug: string,
): SiteLayout {
  const profileIds = PROFILES_BY_APPEARANCE[appearance];
  const profileId = profileIds[hashString(slug) % profileIds.length];
  const profile = ALL_PROFILES[profileId];

  return {
    profileId,
    ...profile,
  };
}

/** Resolve layout with classic fallback for trade sites without an assigned profile. */
export function resolveTradeLayout(
  appearance: TradeAppearanceId,
  layout?: SiteLayout,
): SiteLayout {
  const allowed = PROFILES_BY_APPEARANCE[appearance];
  const fallbackId = allowed.includes("classic")
    ? "classic"
    : allowed[0];
  const fallback = ALL_PROFILES[fallbackId];

  if (!layout?.profileId || !allowed.includes(layout.profileId as TradeLayoutProfileId)) {
    return {
      profileId: fallbackId,
      ...fallback,
    };
  }

  const profileId = layout.profileId as TradeLayoutProfileId;
  const defaults = ALL_PROFILES[profileId] ?? fallback;

  return {
    profileId,
    heroImageSide: layout.heroImageSide ?? defaults.heroImageSide,
    servicesImageSide: layout.servicesImageSide ?? defaults.servicesImageSide,
    heroRatio: layout.heroRatio ?? defaults.heroRatio,
    benefitsMode: layout.benefitsMode ?? defaults.benefitsMode,
    heroAtmosphere: layout.heroAtmosphere ?? defaults.heroAtmosphere,
    sectionRule: layout.sectionRule ?? defaults.sectionRule,
    cardStyle: layout.cardStyle ?? defaults.cardStyle,
  };
}
