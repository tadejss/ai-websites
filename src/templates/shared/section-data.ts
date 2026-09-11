import type {
  ContactFaqItem,
  GalleryItem,
  PricingItem,
  SiteConfig,
} from "@/content/types/site";
import {
  getWhyChooseUsStepDescription,
  getWhyChooseUsStepTitle,
} from "@/content/types/site";
import {
  isBenefitsSectionFlagEnabled,
  isFinalCtaSectionFlagEnabled,
  isPricingSectionVisible,
  isProcessSectionFlagEnabled,
} from "@/content/sections";

/** Merged offer row: prefer pricing items; fall back to services without price. */
export type OfferItem = {
  name: string;
  description?: string;
  price?: string;
  unit?: string;
  featured?: boolean;
};

export type BenefitItem = {
  title: string;
  description?: string;
};

export type ProcessStepItem = {
  title: string;
  description?: string;
};

export function getOfferItems(config: SiteConfig): OfferItem[] {
  if (isPricingSectionVisible(config) && config.pricing) {
    return config.pricing.items.map((item: PricingItem) => ({
      name: item.name,
      description: item.description,
      price: item.price,
      unit: item.unit,
      featured: item.featured,
    }));
  }

  return config.services.items.map((item) => ({
    name: item.title,
    description: item.description,
  }));
}

export function getOfferSectionMeta(config: SiteConfig): {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  disclaimer?: string;
} {
  if (isPricingSectionVisible(config) && config.pricing) {
    return {
      id: config.pricing.id || "cenik",
      eyebrow: config.pricing.eyebrow || "Storitve in cene",
      title: config.pricing.title || "Storitve in cene",
      description: config.pricing.description,
      disclaimer: config.pricing.disclaimer,
    };
  }

  return {
    id: config.services.id || "storitve",
    eyebrow: config.services.eyebrow || "Storitve",
    title: config.services.title || "Storitve",
    description: config.services.description,
  };
}

/**
 * True when this config opted into the expanded section composition.
 * Legacy demos omit benefits/process/finalCta flags → exact historical About behavior.
 */
export function usesExpandedSectionComposition(config: SiteConfig): boolean {
  return (
    isBenefitsSectionFlagEnabled(config) ||
    isProcessSectionFlagEnabled(config) ||
    isFinalCtaSectionFlagEnabled(config)
  );
}

function legacyAboutPoints(config: SiteConfig): string[] {
  const w = config.whyChooseUs;
  return (
    w.highlights?.filter(Boolean).slice(0, 4) ??
    w.benefits?.map((b) => b.title || b.label).filter(Boolean).slice(0, 4) ??
    []
  );
}

export function getBenefitsContent(config: SiteConfig): {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  items: BenefitItem[];
} {
  const w = config.whyChooseUs;
  const fromBenefits: BenefitItem[] = [];
  for (const b of w.benefits ?? []) {
    const title = (b.title || b.label || "").trim();
    if (!title) {
      continue;
    }
    const description = b.description?.trim();
    fromBenefits.push({
      title,
      ...(description ? { description } : {}),
    });
  }

  const items: BenefitItem[] =
    fromBenefits.length >= 3
      ? fromBenefits.slice(0, 4)
      : (w.highlights ?? [])
          .filter(Boolean)
          .slice(0, 4)
          .map((title) => ({ title }));

  return {
    id: "prednosti",
    eyebrow: "Zakaj mi",
    title: "Zakaj nas izberejo",
    description: undefined,
    items,
  };
}

export function isBenefitsVisible(config: SiteConfig): boolean {
  return (
    isBenefitsSectionFlagEnabled(config) &&
    getBenefitsContent(config).items.length >= 3
  );
}

export function getAboutContent(config: SiteConfig): {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
} {
  const w = config.whyChooseUs;
  // Expanded + Benefits: About is intro-only (points live in Benefits).
  const points = isBenefitsVisible(config) ? [] : legacyAboutPoints(config);

  return {
    id: "o-nas",
    eyebrow: "O nas",
    title: w.title?.trim() || config.business.name || "O nas",
    description:
      w.description?.trim() ||
      config.hero.description ||
      config.metadata.description,
    points,
  };
}

export function getProcessContent(config: SiteConfig): {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  steps: ProcessStepItem[];
} {
  const stepsConfig = config.whyChooseUs.steps;
  const raw = stepsConfig?.items ?? [];
  const steps: ProcessStepItem[] = [];
  for (const step of raw) {
    const title = getWhyChooseUsStepTitle(step).trim();
    if (!title) {
      continue;
    }
    const description = getWhyChooseUsStepDescription(step)?.trim();
    steps.push({
      title,
      ...(description ? { description } : {}),
    });
    if (steps.length >= 4) {
      break;
    }
  }

  return {
    id: stepsConfig?.id?.trim() || "postopek",
    eyebrow: stepsConfig?.eyebrow?.trim() || "Postopek",
    title: stepsConfig?.title?.trim() || "Kako poteka sodelovanje",
    description: stepsConfig?.description?.trim() || undefined,
    steps,
  };
}

export function isProcessVisible(config: SiteConfig): boolean {
  if (!isProcessSectionFlagEnabled(config)) {
    return false;
  }
  const { steps } = getProcessContent(config);
  return steps.length >= 3;
}

export function getServiceAreaContent(config: SiteConfig): {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
} | null {
  const area = config.serviceArea;
  if (!area?.description?.trim() || !area.title?.trim()) {
    return null;
  }
  return {
    id: area.id?.trim() || "obmocje",
    eyebrow: area.eyebrow?.trim() || "Območje",
    title: area.title.trim(),
    description: area.description.trim(),
  };
}

export function isServiceAreaVisible(config: SiteConfig): boolean {
  return getServiceAreaContent(config) !== null;
}

export function getFinalCtaContent(config: SiteConfig): {
  id: string;
  title: string;
  description: string;
} {
  return {
    id: "klic-k-akciji",
    title: config.hero.primaryCta?.trim() || config.nav.cta?.trim() || "Pokličite nas",
    description:
      config.contact.description?.trim() ||
      "Za termin ali informacije nas pokličite.",
  };
}

export function isFinalCtaVisible(config: SiteConfig): boolean {
  return isFinalCtaSectionFlagEnabled(config);
}

/** Gallery items from config, or hero/services images as visual fallback. */
export function getGalleryItems(config: SiteConfig): GalleryItem[] {
  const configured = config.gallery?.items ?? [];
  if (configured.length > 0) {
    return configured;
  }

  const fallback: GalleryItem[] = [];
  if (config.images?.hero?.src) {
    fallback.push({
      src: config.images.hero.src,
      alt: config.images.hero.alt || "Delo",
    });
  }
  if (
    config.images?.services?.src &&
    config.images.services.src !== config.images.hero?.src
  ) {
    fallback.push({
      src: config.images.services.src,
      alt: config.images.services.alt || "Storitev",
    });
  }
  return fallback;
}

export function isAboutVisible(config: SiteConfig): boolean {
  const about = getAboutContent(config);
  return Boolean(about.description?.trim() || about.points.length > 0);
}

export function isOfferVisible(config: SiteConfig): boolean {
  return getOfferItems(config).length > 0;
}

export function isGalleryVisible(config: SiteConfig): boolean {
  return getGalleryItems(config).length > 0;
}

export function getFaqItems(config: SiteConfig): ContactFaqItem[] {
  if (config.contact.faq && config.contact.faq.length > 0) {
    return config.contact.faq;
  }

  // Deterministic defaults from known site data — no invented business facts.
  const items: ContactFaqItem[] = [];
  const phone = config.contact.items.find((i) => i.icon === "phone");
  const address = config.contact.items.find((i) => i.icon === "location");
  const hours = config.contact.items.find((i) => i.icon === "clock");

  if (phone?.value) {
    items.push({
      question: "Kako rezerviram termin?",
      answer: `Najhitreje nas pokličite na ${phone.value}.`,
    });
  }
  if (isPricingSectionVisible(config)) {
    items.push({
      question: "Kakšne so cene?",
      answer:
        "Orientacijske cene so navedene v razdelku Storitve in cene. Za točno ponudbo nas kontaktirajte.",
    });
  }
  if (address?.value) {
    items.push({
      question: "Kje se nahajate?",
      answer: address.value,
    });
  }
  if (hours?.value) {
    items.push({
      question: "Kdaj ste odprti?",
      answer: hours.value,
    });
  }

  return items;
}

export function isFaqVisible(config: SiteConfig): boolean {
  return getFaqItems(config).length > 0;
}
