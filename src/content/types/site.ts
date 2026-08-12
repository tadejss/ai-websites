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

export type Benefit = {
  stat: string;
  label: string;
  description: string;
};

export type Stat = {
  value: string;
  label: string;
};

export type ContactItem = {
  label: string;
  value: string;
  href?: string;
  icon: IconName;
};

export type AppearanceId = "default" | "beauty";

export type SiteTheme = {
  paletteId: string;
  fontPairingId: string;
};

export type SiteConfig = {
  appearance?: AppearanceId;
  theme?: SiteTheme;
  brand: {
    prefix: string;
    highlight: string;
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
    stats: Stat[];
  };
  services: {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    items: Service[];
  };
  whyChooseUs: {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    highlights: string[];
    benefits: Benefit[];
  };
  contact: {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
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
  };
};
