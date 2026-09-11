import type {
  GallerySectionConfig,
  PricingSectionConfig,
  ServiceAreaSectionConfig,
  SiteConfig,
} from "./types/site";
import {
  isGallerySectionVisible,
  isPricingSectionVisible,
} from "./sections";
import type { SectionProfile } from "@/templates/category-section-profile";
import {
  getBenefitsContent,
  getOfferSectionMeta,
  getProcessContent,
  isBenefitsVisible,
  isFaqVisible,
  isFinalCtaVisible,
  isGalleryVisible,
  isOfferVisible,
  isProcessVisible,
  isServiceAreaVisible,
} from "@/templates/shared/section-data";

const DEFAULT_PRICING_DISCLAIMER =
  "Cenik je informativen. Za aktualne cene nas kontaktirajte.";

const EMPTY_GALLERY: GallerySectionConfig = {
  id: "galerija",
  eyebrow: "Galerija",
  title: "Vpogled v naše delo",
  description: "Fotografije naših storitev in ambienta.",
  items: [],
};

/** Fill required gallery strings when the model returns a partial section. */
export function normalizeGallerySection(
  gallery: Partial<GallerySectionConfig> | undefined,
): GallerySectionConfig | undefined {
  if (!gallery) {
    return undefined;
  }

  return {
    ...EMPTY_GALLERY,
    ...gallery,
    id: gallery.id?.trim() || EMPTY_GALLERY.id,
    eyebrow: gallery.eyebrow?.trim() || EMPTY_GALLERY.eyebrow,
    title: gallery.title?.trim() || EMPTY_GALLERY.title,
    description: gallery.description?.trim() || EMPTY_GALLERY.description,
    items: gallery.items ?? [],
  };
}

function normalizeServiceArea(
  area: ServiceAreaSectionConfig | undefined,
): ServiceAreaSectionConfig | undefined {
  if (!area?.description?.trim() || !area.title?.trim()) {
    return undefined;
  }
  return {
    id: area.id?.trim() || "obmocje",
    eyebrow: area.eyebrow?.trim() || "Območje",
    title: area.title.trim(),
    description: area.description.trim(),
  };
}

function hasValidProcessSteps(config: SiteConfig): boolean {
  return getProcessContent(config).steps.length >= 3;
}

function hasValidBenefits(config: SiteConfig): boolean {
  return getBenefitsContent(config).items.length >= 3;
}

export type ApplyNewLeadSectionOptions = {
  /** Category generation defaults; flags still require valid content. */
  sectionProfile?: SectionProfile;
  /** Explicit BusinessInput.serviceArea — never invent from address. */
  hasExplicitServiceArea?: boolean;
};

/**
 * Post-AI defaults for newly generated clients only.
 * Enables gallery + pricing; applies expanded section flags only when content exists.
 */
export function applyNewLeadSectionDefaults(
  config: SiteConfig,
  options: ApplyNewLeadSectionOptions = {},
): SiteConfig {
  const gallery: GallerySectionConfig =
    normalizeGallerySection(config.gallery) ?? EMPTY_GALLERY;

  let pricing: PricingSectionConfig | undefined = config.pricing;
  if (pricing) {
    pricing = {
      ...pricing,
      id: pricing.id || "cenik",
      disclaimer: pricing.disclaimer?.trim() || DEFAULT_PRICING_DISCLAIMER,
      items: pricing.items ?? [],
    };
  }

  const serviceArea = normalizeServiceArea(config.serviceArea);
  const profile = options.sectionProfile;

  const benefitsEnabled =
    Boolean(profile?.benefits) && hasValidBenefits(config);
  const processEnabled =
    Boolean(profile?.process) && hasValidProcessSteps(config);
  const serviceAreaEnabled =
    Boolean(profile?.serviceArea) &&
    Boolean(options.hasExplicitServiceArea) &&
    Boolean(serviceArea);
  const finalCtaEnabled = Boolean(profile?.finalCta);

  // Strip empty optional objects for clean old-shape-compatible JSON.
  const next: SiteConfig = {
    ...config,
    sections: {
      ...config.sections,
      gallery: true,
      pricing: true,
      ...(benefitsEnabled ? { benefits: true } : {}),
      ...(processEnabled ? { process: true } : {}),
      ...(finalCtaEnabled ? { finalCta: true } : {}),
    },
    gallery,
    ...(pricing ? { pricing } : {}),
    ...(serviceAreaEnabled && serviceArea
      ? { serviceArea }
      : { serviceArea: undefined }),
  };

  // Drop undefined serviceArea key for cleaner JSON
  if (!serviceAreaEnabled) {
    delete (next as { serviceArea?: ServiceAreaSectionConfig }).serviceArea;
  }

  // If process not enabled, leave steps in place (harmless) but no flag —
  // legacy About path unchanged when benefits/process/finalCta all unset.
  // When only finalCta is set, About still uses legacy points unless benefits is on.

  return withSectionNavLinks(next);
}

export function withSectionNavLinks(config: SiteConfig): SiteConfig {
  const offerMeta = getOfferSectionMeta(config);
  const benefits = getBenefitsContent(config);
  const process = getProcessContent(config);

  const strip = new Set([
    "#galerija",
    "#cenik",
    "#storitve",
    "#zakaj-mi",
    "#o-nas",
    "#faq",
    "#prednosti",
    "#postopek",
    "#obmocje",
    "#klic-k-akciji",
    `#${offerMeta.id}`,
    `#${benefits.id}`,
    `#${process.id}`,
  ]);

  const core = config.nav.links.filter((link) => !strip.has(link.href));

  const extras: { href: string; label: string }[] = [];
  if (config.whyChooseUs?.description || config.whyChooseUs?.highlights?.length) {
    extras.push({ href: "#o-nas", label: "O nas" });
  }
  if (isBenefitsVisible(config)) {
    extras.push({ href: `#${benefits.id}`, label: "Prednosti" });
  }
  if (isOfferVisible(config) || isPricingSectionVisible(config)) {
    extras.push({ href: `#${offerMeta.id}`, label: "Storitve" });
  } else if (config.services.items.length > 0) {
    extras.push({ href: `#${offerMeta.id}`, label: "Storitve" });
  }
  if (isFinalCtaVisible(config)) {
    extras.push({ href: "#klic-k-akciji", label: "Pokličite" });
  }
  if (isProcessVisible(config)) {
    extras.push({ href: `#${process.id}`, label: "Postopek" });
  }
  if (isGalleryVisible(config) || isGallerySectionVisible(config)) {
    extras.push({ href: "#galerija", label: "Galerija" });
  }
  if (isServiceAreaVisible(config) && config.serviceArea) {
    extras.push({
      href: `#${config.serviceArea.id || "obmocje"}`,
      label: "Območje",
    });
  }
  if (isFaqVisible(config)) {
    extras.push({ href: "#faq", label: "FAQ" });
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
