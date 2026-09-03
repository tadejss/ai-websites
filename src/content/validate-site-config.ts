import { z } from "zod";
import { defaultPrivacyConfig } from "@/privacy/defaults";
import { deriveBusinessFromSiteConfig, mergeBusinessInfo } from "@/privacy/derive-business";
import { fontPairingIds } from "@/theme/fonts/pairings";
import { paletteIds } from "@/theme/palettes";
import { lookIds } from "@/catalog/looks";
import type { SiteConfig } from "./types/site";
import type { SiteLookId } from "@/catalog/types";

const iconNameSchema = z.enum([
  "building",
  "menu",
  "check",
  "location",
  "phone",
  "email",
  "clock",
  "sparkles",
  "bolt",
  "service-1",
  "service-2",
  "service-3",
  "service-4",
  "service-5",
  "service-6",
]);

const navLinkSchema = z.object({
  href: z.string(),
  label: z.string(),
});

const serviceSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: iconNameSchema,
});

const benefitVariantSchema = z.enum([
  "warm",
  "dark",
  "minimal",
  "natural",
  "editorial",
  "premium",
]);

const siteImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
  frame: z.enum(["browser"]).optional(),
  srcFallback: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  format: z.enum(["avif", "webp", "jpeg", "jpg", "png"]).optional(),
  fallbackFormat: z.enum(["webp", "jpeg", "jpg", "png"]).optional(),
  provider: z.enum(["pexels", "unsplash"]).optional(),
  sourceId: z.string().optional(),
  sourceUrl: z.string().optional(),
  photographer: z.string().optional(),
  photographerUrl: z.string().optional(),
  searchQuery: z.string().optional(),
});

const benefitSchema = z.object({
  stat: z.string().optional(),
  label: z.string(),
  description: z.string().optional(),
  title: z.string().optional(),
  variant: benefitVariantSchema.optional(),
  image: siteImageSchema.optional(),
  href: z.string().optional(),
});

const statSchema = z.object({
  value: z.string(),
  label: z.string(),
  title: z.string().optional(),
});

const siteImagesSchema = z
  .object({
    hero: siteImageSchema,
    services: siteImageSchema,
  })
  .optional();

const contactItemSchema = z.object({
  label: z.string(),
  value: z.string(),
  href: z.string().optional(),
  icon: iconNameSchema,
});

const contactFormSchema = z.object({
  title: z.string(),
  description: z.string(),
  nameLabel: z.string(),
  namePlaceholder: z.string(),
  phoneLabel: z.string(),
  phonePlaceholder: z.string(),
  messageLabel: z.string(),
  messagePlaceholder: z.string(),
  submitLabel: z.string(),
});

const appearanceSchema = z
  .enum([
    "default",
    "beauty",
    "zbrendiraj",
    "elektro",
    "construction",
    "cleaning",
    "health",
    "auto",
  ])
  .optional();

const layoutSchema = z
  .object({
    profileId: z.enum([
      "classic",
      "media-left",
      "copy-heavy",
      "services-first-visual",
      "airy",
      "stats-forward",
      "image-led",
      "calm-visual",
      "photo-forward",
    ]),
    heroImageSide: z.enum(["left", "right", "none"]).optional(),
    servicesImageSide: z.enum(["left", "right", "none"]).optional(),
    heroRatio: z.enum(["5050", "6040", "full-copy"]).optional(),
    benefitsMode: z.enum(["default", "visual"]).optional(),
    heroAtmosphere: z.enum(["grid", "wash", "plain", "photo"]).optional(),
    sectionRule: z.enum(["line", "none"]).optional(),
    cardStyle: z.enum(["bordered", "soft"]).optional(),
  })
  .optional();

const themeSchema = z
  .object({
    paletteId: z.enum(paletteIds as [string, ...string[]]),
    fontPairingId: z.enum(fontPairingIds as [string, ...string[]]),
  })
  .optional();

const contactFormFieldSchema = z.enum(["name", "phone", "message"]);

const businessSchema = z.object({
  name: z.string(),
  legalName: z.string().optional(),
  address: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
});

const privacySchema = z.object({
  enabled: z.boolean(),
  lastUpdated: z.string(),
  contactForm: z.object({
    enabled: z.boolean(),
    fields: z.array(contactFormFieldSchema),
  }),
  analytics: z.object({
    enabled: z.boolean(),
    provider: z.string().nullable(),
  }),
  marketing: z.object({
    enabled: z.boolean(),
  }),
  booking: z.object({
    enabled: z.boolean(),
    type: z.literal("external_link"),
    providerName: z.string(),
    url: z.string(),
    privacyUrl: z.string().optional(),
  }),
  thirdPartyEmbeds: z.object({
    googleMaps: z.boolean(),
    youtube: z.boolean(),
  }),
  cookies: z.object({
    nonEssential: z.boolean(),
  }),
  terms: z
    .object({
      enabled: z.boolean(),
    })
    .optional(),
});

const whyChooseUsStepItemSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const whyChooseUsStepsSchema = z.object({
  id: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  description: z.string().optional(),
  items: z.array(z.union([z.string(), whyChooseUsStepItemSchema])),
});

const pricingNoteSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const galleryItemSchema = z.object({
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
});

const gallerySectionSchema = z.object({
  id: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  description: z.string().optional(),
  items: z.array(galleryItemSchema),
});

const pricingItemSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.string(),
  unit: z.string().optional(),
  featured: z.boolean().optional(),
});

const pricingSectionSchema = z.object({
  id: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  description: z.string().optional(),
  disclaimer: z.string(),
  items: z.array(pricingItemSchema),
});

const sectionFlagsSchema = z
  .object({
    gallery: z.boolean().optional(),
    pricing: z.boolean().optional(),
  })
  .optional();

const contactFaqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const brandingPathSchema = z
  .string()
  .refine((path) => path.startsWith("/"), "branding paths must start with /");

const brandingSchema = z
  .object({
    logo: brandingPathSchema.optional(),
    icon: brandingPathSchema.optional(),
  })
  .optional();

const lookIdSchema = z.enum(lookIds as [string, ...string[]]).optional();

const siteConfigSchema = z.object({
  appearance: appearanceSchema,
  lookId: lookIdSchema,
  theme: themeSchema,
  layout: layoutSchema,
  images: siteImagesSchema,
  sections: sectionFlagsSchema,
  gallery: gallerySectionSchema.optional(),
  pricing: pricingSectionSchema.optional(),
  brand: z.object({
    prefix: z.string(),
    highlight: z.string(),
    hideMonogram: z.boolean().optional(),
  }),
  branding: brandingSchema,
  metadata: z.object({
    title: z.string(),
    description: z.string(),
  }),
  nav: z.object({
    links: z.array(navLinkSchema),
    cta: z.string(),
  }),
  hero: z.object({
    badge: z.string(),
    title: z.string(),
    titleHighlight: z.string(),
    description: z.string(),
    primaryCta: z.string(),
    secondaryCta: z.string(),
    secondaryCtaHref: z.string().optional(),
    stats: z.array(statSchema),
  }),
  services: z.object({
    id: z.string(),
    eyebrow: z.string(),
    title: z.string(),
    description: z.string(),
    items: z.array(serviceSchema),
    pricing: pricingNoteSchema.optional(),
  }),
  whyChooseUs: z.object({
    id: z.string(),
    eyebrow: z.string(),
    title: z.string(),
    description: z.string(),
    highlights: z.array(z.string()),
    benefits: z.array(benefitSchema),
    steps: whyChooseUsStepsSchema.optional(),
  }),
  contact: z.object({
    id: z.string(),
    eyebrow: z.string(),
    title: z.string(),
    description: z.string(),
    faq: z.array(contactFaqItemSchema).optional(),
    items: z.array(contactItemSchema),
    form: contactFormSchema,
  }),
  footer: z.object({
    address: z.string(),
    rights: z.string(),
    tagline: z.string().optional(),
    managedBy: z.string().optional(),
  }),
  business: businessSchema.optional(),
  privacy: privacySchema.optional(),
});

export function validateSiteConfig(data: unknown): SiteConfig {
  const parsed = siteConfigSchema.parse(data);
  const base = {
    ...parsed,
    appearance: parsed.appearance ?? "default",
  };
  const derivedBusiness = deriveBusinessFromSiteConfig(base);

  return {
    ...base,
    lookId: parsed.lookId as SiteLookId | undefined,
    business: mergeBusinessInfo(derivedBusiness, parsed.business),
    privacy: parsed.privacy ?? defaultPrivacyConfig(),
  };
}
