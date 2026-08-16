export type IconName =
  | "building"
  | "menu"
  | "check"
  | "location"
  | "phone"
  | "email"
  | "clock"
  | "service-1"
  | "service-2"
  | "service-3"
  | "service-4"
  | "service-5"
  | "service-6";

export type NavLink = {
  href: string;
  label: string;
};

export type Service = {
  title: string;
  description: string;
  icon: IconName;
};

export type BenefitVariant =
  | "warm"
  | "dark"
  | "minimal"
  | "natural"
  | "editorial"
  | "premium";

export type Benefit = {
  stat?: string;
  label: string;
  description?: string;
  title?: string;
  variant?: BenefitVariant;
  image?: SiteImage;
  href?: string;
};

export type WhyChooseUsSteps = {
  id: string;
  eyebrow: string;
  title: string;
  items: string[];
};

export type PricingNote = {
  title: string;
  description: string;
};

export type ContactFaqItem = {
  question: string;
  answer: string;
};

export type Stat = {
  value: string;
  label: string;
  title?: string;
};

export type SiteImage = {
  src: string;
  alt: string;
  frame?: "browser";
};

export type SiteImages = {
  hero: SiteImage;
  services: SiteImage;
};

export type ContactItem = {
  label: string;
  value: string;
  href?: string;
  icon: IconName;
};

export type AppearanceId = "default" | "beauty" | "zbrendiraj";

export type SiteTheme = {
  paletteId: string;
  fontPairingId: string;
};

export type ContactFormField = "name" | "phone" | "message";

export type SiteBusinessInfo = {
  name: string;
  legalName?: string;
  address: string;
  email: string;
  phone?: string;
  registrationNumber?: string;
  vatNumber?: string;
};

export type SitePrivacyConfig = {
  enabled: boolean;
  lastUpdated: string;
  contactForm: {
    enabled: boolean;
    fields: ContactFormField[];
  };
  analytics: {
    enabled: boolean;
    provider: string | null;
  };
  marketing: {
    enabled: boolean;
  };
  booking: {
    enabled: boolean;
    type: "external_link";
    providerName: string;
    url: string;
    privacyUrl?: string;
  };
  thirdPartyEmbeds: {
    googleMaps: boolean;
    youtube: boolean;
  };
  cookies: {
    nonEssential: boolean;
  };
  terms?: {
    enabled: boolean;
  };
};

export type SiteConfig = {
  appearance?: AppearanceId;
  theme?: SiteTheme;
  images?: SiteImages;
  brand: {
    prefix: string;
    highlight: string;
    hideMonogram?: boolean;
  };
  metadata: {
    title: string;
    description: string;
  };
  nav: {
    links: NavLink[];
    cta: string;
  };
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    secondaryCtaHref?: string;
    stats: Stat[];
  };
  services: {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    items: Service[];
    pricing?: PricingNote;
  };
  whyChooseUs: {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    highlights: string[];
    benefits: Benefit[];
    steps?: WhyChooseUsSteps;
  };
  contact: {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    faq?: ContactFaqItem[];
    items: ContactItem[];
    form: {
      title: string;
      description: string;
      nameLabel: string;
      namePlaceholder: string;
      phoneLabel: string;
      phonePlaceholder: string;
      messageLabel: string;
      messagePlaceholder: string;
      submitLabel: string;
    };
  };
  footer: {
    address: string;
    rights: string;
    tagline?: string;
    managedBy?: string;
  };
  business: SiteBusinessInfo;
  privacy: SitePrivacyConfig;
};
