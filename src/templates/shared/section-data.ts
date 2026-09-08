import type {
  ContactFaqItem,
  GalleryItem,
  PricingItem,
  SiteConfig,
} from "@/content/types/site";
import { isPricingSectionVisible } from "@/content/sections";

/** Merged offer row: prefer pricing items; fall back to services without price. */
export type OfferItem = {
  name: string;
  description?: string;
  price?: string;
  unit?: string;
  featured?: boolean;
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
      id: "cenik",
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

export function getAboutContent(config: SiteConfig): {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
} {
  const w = config.whyChooseUs;
  const points =
    w.highlights?.filter(Boolean).slice(0, 4) ??
    w.benefits?.map((b) => b.title || b.label).filter(Boolean).slice(0, 4) ??
    [];

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
