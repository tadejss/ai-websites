import type {
  GallerySectionConfig,
  PricingSectionConfig,
  SiteConfig,
} from "./types/site";
import { isGallerySectionVisible, isPricingSectionVisible } from "./sections";

const DEFAULT_PRICING_DISCLAIMER =
  "Cenik je informativen. Za aktualne cene nas kontaktirajte.";

const EMPTY_GALLERY: GallerySectionConfig = {
  id: "galerija",
  eyebrow: "Galerija",
  title: "Vpogled v naše delo",
  description: "Fotografije naših storitev in ambienta.",
  items: [],
};

/**
 * Post-AI defaults for newly generated clients only.
 * Enables gallery + pricing flags; keeps gallery items empty unless already present.
 * Ensures pricing disclaimer and adds a #cenik nav link when pricing will be visible.
 */
export function applyNewLeadSectionDefaults(config: SiteConfig): SiteConfig {
  const gallery: GallerySectionConfig = config.gallery
    ? {
        ...config.gallery,
        id: config.gallery.id || "galerija",
        items: config.gallery.items ?? [],
      }
    : EMPTY_GALLERY;

  let pricing: PricingSectionConfig | undefined = config.pricing;
  if (pricing) {
    pricing = {
      ...pricing,
      id: pricing.id || "cenik",
      disclaimer: pricing.disclaimer?.trim() || DEFAULT_PRICING_DISCLAIMER,
      items: pricing.items ?? [],
    };
  }

  const next: SiteConfig = {
    ...config,
    sections: {
      gallery: true,
      pricing: true,
      ...config.sections,
    },
    gallery,
    ...(pricing ? { pricing } : {}),
  };

  return withSectionNavLinks(next);
}

function withSectionNavLinks(config: SiteConfig): SiteConfig {
  const core = config.nav.links.filter(
    (link) => link.href !== "#galerija" && link.href !== "#cenik",
  );
  const extras: { href: string; label: string }[] = [];

  if (isGallerySectionVisible(config)) {
    extras.push({ href: "#galerija", label: "Galerija" });
  }
  if (isPricingSectionVisible(config)) {
    extras.push({ href: "#cenik", label: "Cenik" });
  }

  const links = [...core];
  const contactIndex = links.findIndex((link) => link.href === "#kontakt");
  if (contactIndex >= 0) {
    links.splice(contactIndex, 0, ...extras);
  } else {
    links.push(...extras);
  }

  return {
    ...config,
    nav: {
      ...config.nav,
      links,
    },
  };
}
