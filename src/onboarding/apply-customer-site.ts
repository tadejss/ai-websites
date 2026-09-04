import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import type { BusinessInput } from "@/ai/types";
import { withSectionNavLinks } from "@/content/apply-new-lead-sections";
import type { SiteConfig } from "@/content/types/site";
import { validateSiteConfig } from "@/content/validate-site-config";
import { mergeSiteHintsWithAnswers } from "./images";
import type {
  CustomerOnboardingAnswers,
  ProcessedOnboardingPayload,
} from "./types";

const SERVICE_ICONS = [
  "service-1",
  "service-2",
  "service-3",
  "service-4",
  "service-5",
  "service-6",
] as const;

function clientDir(slug: string): string {
  return resolve(process.cwd(), "src/content/clients", slug);
}

function readJsonFile<T>(path: string): T | null {
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJsonFile(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

function mailtoHref(email: string): string {
  return email.trim() ? `mailto:${email.trim()}` : "";
}

function updateContactItem(
  items: SiteConfig["contact"]["items"],
  icon: "location" | "phone" | "email" | "clock",
  label: string,
  value: string | undefined,
  href?: string,
): SiteConfig["contact"]["items"] {
  if (!value?.trim()) {
    return items;
  }

  const trimmed = value.trim();
  const next = [...items];
  const index = next.findIndex((item) => item.icon === icon);

  const entry = {
    label,
    value: trimmed,
    icon,
    ...(href ? { href } : {}),
  };

  if (index >= 0) {
    next[index] = { ...next[index], ...entry };
  } else {
    next.push(entry);
  }

  return next;
}

function mapServicesToItems(
  services: string[],
  existing: SiteConfig["services"]["items"],
): SiteConfig["services"]["items"] {
  return services.map((title, index) => {
    const prior = existing[index];
    return {
      title: title.trim(),
      description: prior?.description?.trim() || title.trim(),
      icon: prior?.icon ?? SERVICE_ICONS[index % SERVICE_ICONS.length]!,
    };
  });
}

export function mergeSiteConfigWithOnboarding(
  siteConfig: SiteConfig,
  businessInput: BusinessInput,
  hints: ProcessedOnboardingPayload["siteHints"],
): SiteConfig {
  const companyName = businessInput.companyName?.trim();
  let next: SiteConfig = { ...siteConfig };

  if (companyName) {
    next = {
      ...next,
      metadata: {
        ...next.metadata,
        title: companyName,
        description:
          businessInput.tagline?.trim() || next.metadata.description,
      },
    };
  }

  if (businessInput.services?.length) {
    next = {
      ...next,
      services: {
        ...next.services,
        items: mapServicesToItems(businessInput.services, next.services.items),
      },
    };
  }

  if (businessInput.sellingPoints?.length) {
    next = {
      ...next,
      whyChooseUs: {
        ...next.whyChooseUs,
        highlights: businessInput.sellingPoints,
      },
    };
  }

  let contactItems = next.contact.items;
  contactItems = updateContactItem(
    contactItems,
    "location",
    "Naslov",
    businessInput.address,
  );
  contactItems = updateContactItem(
    contactItems,
    "phone",
    "Telefon",
    businessInput.phone,
    businessInput.phone ? telHref(businessInput.phone) : undefined,
  );
  contactItems = updateContactItem(
    contactItems,
    "email",
    "Email",
    businessInput.email,
    businessInput.email ? mailtoHref(businessInput.email) : undefined,
  );
  contactItems = updateContactItem(
    contactItems,
    "clock",
    "Delovni čas",
    businessInput.openingHours,
  );

  next = {
    ...next,
    contact: { ...next.contact, items: contactItems },
    footer: {
      ...next.footer,
      address: businessInput.address?.trim() || next.footer.address,
    },
  };

  const photoUrls = [
    ...(hints.photoUrls ?? []),
    ...(hints.uploadedImages ?? [])
      .filter((img) => img.kind === "photo")
      .map((img) => img.url),
  ].filter((url, index, all) => url && all.indexOf(url) === index);
  const logoUrl =
    hints.logoUrls?.[0] ??
    hints.uploadedImages?.find((img) => img.kind === "logo")?.url;

  if (photoUrls.length > 0) {
    const galleryBase = next.gallery ?? {
      id: "galerija",
      eyebrow: "Galerija",
      title: "Vpogled v naše delo",
      description: "Fotografije naših storitev in ambienta.",
      items: [],
    };
    next = {
      ...next,
      sections: {
        ...next.sections,
        gallery: true,
      },
      gallery: {
        ...galleryBase,
        items: photoUrls.map((src, index) => ({
          src,
          alt: `${companyName ?? next.brand.prefix} – fotografija ${index + 1}`,
        })),
      },
    };
  }

  if (logoUrl) {
    next = {
      ...next,
      branding: {
        ...next.branding,
        logo: logoUrl,
      },
    };
  }

  const withBusiness: SiteConfig = {
    ...next,
    business: {
      name: companyName || next.business?.name || next.brand.prefix,
      legalName: companyName || next.business?.legalName,
      address: businessInput.address?.trim() || next.business?.address || "",
      email: businessInput.email?.trim() || next.business?.email || "",
      phone: businessInput.phone?.trim() || next.business?.phone,
      registrationNumber: next.business?.registrationNumber,
      vatNumber: next.business?.vatNumber,
    },
  };

  return validateSiteConfig(
    photoUrls.length > 0 ? withSectionNavLinks(withBusiness) : withBusiness,
  );
}

function snapshotDemoIfNeeded(slug: string): void {
  const dir = clientDir(slug);
  const demoDir = resolve(dir, "demo");
  const demoSite = resolve(demoDir, "site.json");
  if (existsSync(demoSite)) {
    return;
  }

  const sitePath = resolve(dir, "site.json");
  const businessPath = resolve(dir, "business.json");
  if (!existsSync(sitePath)) {
    throw new Error(`Missing site.json for slug "${slug}"`);
  }

  mkdirSync(demoDir, { recursive: true });
  copyFileSync(sitePath, demoSite);
  if (existsSync(businessPath)) {
    copyFileSync(businessPath, resolve(demoDir, "business.json"));
  }
}

export type ApplyCustomerSiteResult = {
  slug: string;
  clientPath: string;
  demoSnapshotted: boolean;
  filesWritten: string[];
};

/**
 * Write customer-approved content to git-backed client JSON.
 * Snapshots the pre-customer demo to demo/ on first apply.
 */
export function applyCustomerSite(
  slug: string,
  payload: ProcessedOnboardingPayload,
  answers?: CustomerOnboardingAnswers | null,
): ApplyCustomerSiteResult {
  const dir = clientDir(slug);
  const sitePath = resolve(dir, "site.json");
  const businessPath = resolve(dir, "business.json");

  if (!existsSync(sitePath)) {
    throw new Error(`Client site.json not found for slug "${slug}"`);
  }

  const hadDemoSnapshot = existsSync(resolve(dir, "demo", "site.json"));
  snapshotDemoIfNeeded(slug);

  const existingSite = readJsonFile<SiteConfig>(sitePath);
  if (!existingSite) {
    throw new Error(`Could not read site.json for slug "${slug}"`);
  }

  const businessInput = payload.businessInput as BusinessInput;
  const mergedSite = mergeSiteConfigWithOnboarding(
    existingSite,
    businessInput,
    mergeSiteHintsWithAnswers(payload.siteHints, answers),
  );

  writeJsonFile(sitePath, mergedSite);
  writeJsonFile(businessPath, {
    ...(readJsonFile<Record<string, unknown>>(businessPath) ?? {}),
    ...businessInput,
  });

  return {
    slug,
    clientPath: `src/content/clients/${slug}`,
    demoSnapshotted: !hadDemoSnapshot,
    filesWritten: [sitePath, businessPath],
  };
}
