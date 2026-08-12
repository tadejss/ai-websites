import { z } from "zod";
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

const benefitSchema = z.object({
  stat: z.string(),
  label: z.string(),
  description: z.string(),
});

const statSchema = z.object({
  value: z.string(),
  label: z.string(),
});

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

const appearanceSchema = z.enum(["default", "beauty"]).optional();

const themeSchema = z
  .object({
    paletteId: z.enum(paletteIds as [string, ...string[]]),
    fontPairingId: z.enum(fontPairingIds as [string, ...string[]]),
  })
  .optional();

const siteConfigSchema = z.object({
  appearance: appearanceSchema,
  theme: themeSchema,
  brand: z.object({
    prefix: z.string(),
    highlight: z.string(),
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
    stats: z.array(statSchema),
  }),
  services: z.object({
    id: z.string(),
    eyebrow: z.string(),
    title: z.string(),
    description: z.string(),
    items: z.array(serviceSchema),
  }),
  whyChooseUs: z.object({
    id: z.string(),
    eyebrow: z.string(),
    title: z.string(),
    description: z.string(),
    highlights: z.array(z.string()),
    benefits: z.array(benefitSchema),
  }),
  contact: z.object({
    id: z.string(),
    eyebrow: z.string(),
    title: z.string(),
    description: z.string(),
    items: z.array(contactItemSchema),
    form: contactFormSchema,
  }),
  footer: z.object({
    address: z.string(),
    rights: z.string(),
  }),
}) satisfies z.ZodType<SiteConfig>;

export function validateSiteConfig(data: unknown): SiteConfig {
  const parsed = siteConfigSchema.parse(data);

  return {
    ...parsed,
    appearance: parsed.appearance ?? "default",
  };
}
