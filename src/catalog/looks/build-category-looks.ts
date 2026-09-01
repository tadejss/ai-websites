import type { ImagePoolCategoryId } from "@/images/image-pool-category";
import type { AppearanceId, SiteLayout } from "@/content/types/site";
import type { SiteLookDefinition } from "@/catalog/types";
import {
  archetypeToDesignTokens,
  LOOK_ARCHETYPES,
  type LookArchetype,
} from "@/catalog/archetypes";
import { appearanceForCategory } from "@/catalog/category-appearance-map";
import { generateCategoryPalettes } from "@/catalog/palettes/generate-palettes";
import { buildCategoryFontPairings } from "@/catalog/fonts/build-pairings";
import { isTradeAppearance } from "@/appearances/types";

function archetypeToLayout(
  archetype: LookArchetype,
  appearance: AppearanceId,
): SiteLayout {
  if (isTradeAppearance(appearance)) {
    return archetypeToTradeLayout(archetype);
  }

  return archetypeToBeautyLayout(archetype);
}

function archetypeToBeautyLayout(archetype: LookArchetype): SiteLayout {
  switch (archetype.heroStyle) {
    case "typographic":
      return {
        profileId: "copy-heavy",
        heroImageSide: "none",
        servicesImageSide: "none",
        heroRatio: "full-copy",
        benefitsMode: "default",
      };
    case "photo-dominant":
      return {
        profileId: "media-left",
        heroImageSide: "left",
        servicesImageSide: "right",
        heroRatio: "6040",
        benefitsMode: "default",
      };
    case "stats-forward":
      return {
        profileId: "classic",
        heroImageSide: "none",
        servicesImageSide: "right",
        heroRatio: "full-copy",
        benefitsMode: "default",
      };
    case "minimal":
      return {
        profileId: "airy",
        heroImageSide: "none",
        servicesImageSide: "none",
        heroRatio: "full-copy",
        benefitsMode: "default",
      };
    case "service-first":
      return {
        profileId: "services-first-visual",
        heroImageSide: "right",
        servicesImageSide: "none",
        heroRatio: "5050",
        benefitsMode: "visual",
      };
    case "asymmetric":
      return {
        profileId: "media-left",
        heroImageSide: "left",
        servicesImageSide: "left",
        heroRatio: "6040",
        benefitsMode: "default",
      };
    case "stacked":
      return {
        profileId: "classic",
        heroImageSide: "right",
        servicesImageSide: "right",
        heroRatio: "5050",
        benefitsMode: "visual",
      };
  }

  return {
    profileId: "classic",
    heroImageSide: "right",
    servicesImageSide: "right",
    heroRatio: "5050",
    benefitsMode: "default",
  };
}

function archetypeToTradeLayout(archetype: LookArchetype): SiteLayout {
  switch (archetype.heroStyle) {
    case "typographic":
      return {
        profileId: "copy-heavy",
        heroImageSide: "none",
        servicesImageSide: "none",
        heroRatio: "full-copy",
        benefitsMode: "default",
        heroAtmosphere: "plain",
        sectionRule: "none",
        cardStyle: "soft",
      };
    case "photo-dominant":
      return {
        profileId: "photo-forward",
        heroImageSide: "none",
        servicesImageSide: "right",
        heroRatio: "full-copy",
        benefitsMode: "default",
        heroAtmosphere: "photo",
        sectionRule: "line",
        cardStyle: "bordered",
      };
    case "stats-forward":
      return {
        profileId: "stats-forward",
        heroImageSide: "none",
        servicesImageSide: "right",
        heroRatio: "full-copy",
        benefitsMode: "default",
        heroAtmosphere: "plain",
        sectionRule: "line",
        cardStyle: "bordered",
      };
    case "minimal":
      return {
        profileId: "airy",
        heroImageSide: "none",
        servicesImageSide: "none",
        heroRatio: "full-copy",
        benefitsMode: "default",
        heroAtmosphere: "plain",
        sectionRule: "none",
        cardStyle: archetype.cardTreatment === "outlined" ? "bordered" : "soft",
      };
    case "service-first":
      return {
        profileId: "services-first-visual",
        heroImageSide: "right",
        servicesImageSide: "none",
        heroRatio: "5050",
        benefitsMode: "visual",
        heroAtmosphere: "wash",
        sectionRule: "none",
        cardStyle: "bordered",
      };
    case "asymmetric":
      return {
        profileId: "image-led",
        heroImageSide: "left",
        servicesImageSide: "right",
        heroRatio: "6040",
        benefitsMode: "default",
        heroAtmosphere: "grid",
        sectionRule: "none",
        cardStyle: "soft",
      };
    case "stacked":
      return {
        profileId: "calm-visual",
        heroImageSide: "none",
        servicesImageSide: "left",
        heroRatio: "full-copy",
        benefitsMode: "visual",
        heroAtmosphere: "wash",
        sectionRule: "none",
        cardStyle: "soft",
      };
    case "split-image":
      if (archetype.preferDark) {
        return {
          profileId: "classic",
          heroImageSide: "right",
          servicesImageSide: "right",
          heroRatio: "5050",
          benefitsMode: "default",
          heroAtmosphere: "grid",
          sectionRule: "line",
          cardStyle: "soft",
        };
      }
      break;
  }

  return {
    profileId: "classic",
    heroImageSide: "right",
    servicesImageSide: "right",
    heroRatio: "5050",
    benefitsMode: "default",
    heroAtmosphere: archetype.sectionRhythm === "airy" ? "plain" : "grid",
    sectionRule: archetype.sectionRhythm === "airy" ? "none" : "line",
    cardStyle:
      archetype.cardTreatment === "elevated" ||
      archetype.cardTreatment === "flat"
        ? "soft"
        : "bordered",
  };
}

export function buildCategoryLooks(
  categoryId: ImagePoolCategoryId,
): SiteLookDefinition[] {
  const appearance = appearanceForCategory(categoryId);
  const appearanceMode = appearance === "beauty" ? "beauty" : "trade";
  const palettes = generateCategoryPalettes(categoryId, appearanceMode);
  const fonts = buildCategoryFontPairings(categoryId, appearanceMode);

  return LOOK_ARCHETYPES.map((archetype, index) => {
    const num = String(index + 1).padStart(2, "0");
    const id = `${categoryId}-${num}-${archetype.suffix}` as SiteLookDefinition["id"];
    const palette = palettes[index]!;
    const font = fonts[index]!;

    return {
      id,
      categoryId,
      displayName: `${categoryId} — ${archetype.displaySuffix}`,
      description: archetype.description,
      appearance,
      theme: {
        paletteId: palette.id,
        fontPairingId: font.id,
      },
      layout: archetypeToLayout(archetype, appearance),
      designTokens: archetypeToDesignTokens(archetype),
      contrastMin: {
        body: 4.5,
        largeText: 3,
        ui: 3,
      },
      status: "approved" as const,
      preview: {
        thumbnailPath: `/catalog/previews/${id}.webp`,
      },
    };
  });
}
