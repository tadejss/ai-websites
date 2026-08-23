import { z } from "zod";
import { defaultPrivacyConfig } from "@/privacy/defaults";
import { deriveBusinessFromSiteConfig, mergeBusinessInfo } from "@/privacy/derive-business";
import { fontPairingIds } from "@/theme/fonts/pairings";
import { paletteIds } from "@/theme/palettes";
import type { SiteConfig } from "./types/site";

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
    ]),
    heroImageSide: z.enum(["left", "right", "none"]).optional(),
    servicesImageSide: z.enum(["left", "right", "none"]).optional(),
    heroRatio: z.enum(["5050", "6040", "full-copy"]).optional(),
    benefitsMode: z.enum(["default", "visual"]).optional(),
    heroAtmosphere: z.enum(["grid", "wash", "plain"]).optional(),
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

const contactFaqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const siteConfigSchema = z.object({
  appearance: appearanceSchema,
  theme: themeSchema,
  layout: layoutSchema,
  images: siteImagesSchema,
  brand: z.object({
    prefix: z.string(),
    highlight: z.string(),
    hideMonogram: z.boolean().optional(),
  }),
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
    business: mergeBusinessInfo(derivedBusiness, parsed.business),
    privacy: parsed.privacy ?? defaultPrivacyConfig(),
  };
}
