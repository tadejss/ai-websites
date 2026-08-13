import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { IconName, SiteConfig } from "../src/content/types/site";
import { validateSiteConfig } from "../src/content/validate-site-config";

type SiteInput = {
  companyName?: string;
  industry?: string;
  tagline?: string;
  services?: string[];
  phone?: string;
  email?: string;
  address?: string;
  openingHours?: string;
  sellingPoints?: string[];
};

const SERVICE_ICONS: IconName[] = [
  "service-1",
  "service-2",
  "service-3",
  "service-4",
  "service-5",
  "service-6",
];

const DEFAULTS = {
  companyName: "Ime Podjetja",
  industry: "Lokalno podjetje",
  tagline:
    "Profesionalne storitve v vaši bližini. Zanesljivost, kakovost in osebni pristop.",
  services: [
    "Osnovne storitve",
    "Specializirane storitve",
    "Svetovanje",
    "Vzdrževanje",
  ],
  phone: "+386 1 000 00 00",
  email: "info@podjetje.si",
  address: "Ulica 123, 1000 Mesto",
  openingHours: "Pon–Pet: 8:00–17:00 · Sob: 9:00–13:00",
  sellingPoints: [
    "Izkušena ekipa z rednimi usposabljanji",
    "Brez skritih stroškov — ceno vedno potrdite vnaprej",
    "Prilagojene rešitve za posameznike in podjetja",
    "Dolgoročno partnerstvo z našimi strankami",
  ],
  serviceDescription:
    "Storitev, prilagojena potrebam naših strank, z jasno komunikacijo in zanesljivo izvedbo.",
  heroStats: [
    { value: "500+", label: "zadovoljnih strank" },
    { value: "4,9", label: "povprečna ocena" },
    { value: "10+", label: "let izkušenj" },
    { value: "24 h", label: "odzivni čas" },
  ],
  benefits: [
    {
      stat: "10+",
      label: "let izkušenj",
      description:
        "Dolgoletna tradicija in tisoče zadovoljnih strank v lokalni skupnosti.",
    },
    {
      stat: "48 h",
      label: "hitra storitev",
      description:
        "Večino povpraševanj obravnavamo v dveh delovnih dneh z jasno povratno informacijo.",
    },
    {
      stat: "100 %",
      label: "zavezanost",
      description:
        "Stojimo za kakovostjo našega dela in zadovoljstvom vsake stranke.",
    },
  ],
};

const root = resolve(__dirname, "..");
const inputPath = resolve(root, "scripts/site-input.example.json");
const outputPath = resolve(root, "src/content/sites/generated.json");

function hasText(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasItems<T>(items: T[] | undefined): items is T[] {
  return Array.isArray(items) && items.length > 0;
}

function pickText(value: string | undefined, fallback: string): string {
  return hasText(value) ? value.trim() : fallback;
}

function pickItems(value: string[] | undefined, fallback: string[]): string[] {
  if (!hasItems(value)) {
    return fallback;
  }

  const items = value.map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function splitBrandName(name: string): { prefix: string; highlight: string } {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 0 || parts[0] === "") {
    return { prefix: DEFAULTS.companyName, highlight: "" };
  }

  if (parts.length === 1) {
    return { prefix: parts[0], highlight: "" };
  }

  return {
    prefix: parts.slice(0, -1).join(" "),
    highlight: parts.at(-1) ?? "",
  };
}

function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function toMailtoHref(email: string): string {
  return `mailto:${email.trim()}`;
}

function mapSiteInputToConfig(
  input: SiteInput,
): Omit<SiteConfig, "business" | "privacy"> {
  const companyName = pickText(input.companyName, DEFAULTS.companyName);
  const industry = pickText(input.industry, DEFAULTS.industry);
  const tagline = pickText(input.tagline, DEFAULTS.tagline);
  const serviceNames = pickItems(input.services, DEFAULTS.services);
  const phone = pickText(input.phone, DEFAULTS.phone);
  const email = pickText(input.email, DEFAULTS.email);
  const address = pickText(input.address, DEFAULTS.address);
  const openingHours = pickText(input.openingHours, DEFAULTS.openingHours);
  const sellingPoints = pickItems(input.sellingPoints, DEFAULTS.sellingPoints);
  const brand = splitBrandName(companyName);

  return {
    brand,
    metadata: {
      title: `${companyName} | ${industry}`,
      description: tagline,
    },
    nav: {
      links: [
        { href: "#storitve", label: "Storitve" },
        { href: "#zakaj-mi", label: "Zakaj mi" },
        { href: "#kontakt", label: "Kontakt" },
      ],
      cta: "Rezerviraj termin",
    },
    hero: {
      badge: openingHours,
      title: "Kakovostna storitev v",
      titleHighlight: "vaši bližini",
      description: tagline,
      primaryCta: "Rezerviraj termin",
      secondaryCta: "Naše storitve",
      stats: DEFAULTS.heroStats,
    },
    services: {
      id: "storitve",
      eyebrow: "Storitve",
      title: "Vse, kar potrebujete na enem mestu",
      description: `Ponujamo storitve s področja ${industry.toLowerCase()}. Vsak projekt obravnavamo s skrbnostjo in pozornostjo do detajlov.`,
      items: serviceNames.slice(0, SERVICE_ICONS.length).map((title, index) => ({
        title,
        description: DEFAULTS.serviceDescription,
        icon: SERVICE_ICONS[index],
      })),
    },
    whyChooseUs: {
      id: "zakaj-mi",
      eyebrow: "Zakaj mi",
      title: "Kakovost, ki ji stranke zaupajo",
      description:
        "Verjamemo v transparentnost, natančnost in osebni pristop. Vsako stranko obravnavamo enako skrbno in profesionalno.",
      highlights: sellingPoints,
      benefits: DEFAULTS.benefits,
    },
    contact: {
      id: "kontakt",
      eyebrow: "Kontakt",
      title: "Stopite v stik z nami",
      description:
        "Pokličite nas, pošljite sporočilo ali nas obiščite. Odgovorimo v najkrajšem možnem času.",
      items: [
        {
          label: "Naslov",
          value: address,
          icon: "location",
        },
        {
          label: "Telefon",
          value: phone,
          href: toTelHref(phone),
          icon: "phone",
        },
        {
          label: "E-pošta",
          value: email,
          href: toMailtoHref(email),
          icon: "email",
        },
        {
          label: "Delovni čas",
          value: openingHours,
          icon: "clock",
        },
      ],
      form: {
        title: "Pošljite povpraševanje",
        description:
          "Izpolnite obrazec in odgovorili vam bomo v enem delovnem dnevu.",
        nameLabel: "Ime in priimek",
        namePlaceholder: "Ime Priimek",
        phoneLabel: "Telefon",
        phonePlaceholder: phone,
        messageLabel: "Sporočilo",
        messagePlaceholder: "Opišite, kako vam lahko pomagamo...",
        submitLabel: "Pošlji povpraševanje",
      },
    },
    footer: {
      address,
      rights: "Vse pravice pridržane.",
    },
  };
}

function main(): void {
  const rawInput = readFileSync(inputPath, "utf8");
  const input = JSON.parse(rawInput) as SiteInput;
  const config = validateSiteConfig(mapSiteInputToConfig(input));

  writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  console.log(`Generated site config: src/content/sites/generated.json`);
  console.log(`Run with: SITE_SLUG=generated npm run dev`);
}

main();
