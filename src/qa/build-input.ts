import { readFileSync } from "node:fs";
import type { BusinessInput } from "@/ai/types";
import { collectVisibleCopy } from "@/ai/validate-claims";
import type { SiteConfig } from "@/content/types/site";
import { validateSiteConfig } from "@/content/validate-site-config";
import { getDemoLifecycleBySlug } from "@/demo-lifecycle/store";
import { isDatabaseConfigured } from "@/db/client";
import {
  clientBusinessPath,
  clientSitePath,
} from "@/leads/client-exists";
import { readLead } from "@/leads/store";
import { extractCity, runDeterministicChecks } from "./deterministic";
import type { QaBusinessSlice, QaInput, QaSiteCopy } from "./types";

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function toBusinessSlice(business: BusinessInput): QaBusinessSlice {
  return {
    companyName: business.companyName,
    industry: business.industry,
    tagline: business.tagline,
    services: business.services,
    phone: business.phone,
    email: business.email,
    address: business.address,
    openingHours: business.openingHours,
    sellingPoints: business.sellingPoints,
    targetCustomers: business.targetCustomers,
    serviceArea: business.serviceArea,
    yearsExperience: business.yearsExperience,
    tone: business.tone,
    callToAction: business.callToAction,
  };
}

function toSiteCopy(site: SiteConfig): QaSiteCopy {
  return {
    brand: `${site.brand.prefix} ${site.brand.highlight}`.trim(),
    metadataTitle: site.metadata.title,
    metadataDescription: site.metadata.description,
    heroTitle: site.hero.title,
    heroHighlight: site.hero.titleHighlight,
    heroDescription: site.hero.description,
    primaryCta: site.hero.primaryCta,
    secondaryCta: site.hero.secondaryCta,
    services: site.services.items.map((item) => ({
      title: item.title,
      description: item.description,
    })),
    contactItems: site.contact.items.map((item) => ({
      label: item.label,
      value: item.value,
    })),
    pricing: site.pricing
      ? site.pricing.items.map((item) => ({
          name: item.name,
          price: item.price,
        }))
      : null,
    footerAddress: site.footer.address,
    visibleCopy: collectVisibleCopy(site).map(([field, value]) => ({
      field,
      value,
    })),
  };
}

export function loadGeneratedSite(slug: string): {
  site: SiteConfig;
  business: BusinessInput;
} {
  const site = validateSiteConfig(readJson(clientSitePath(slug)));
  const business = readJson(clientBusinessPath(slug)) as BusinessInput;
  return { site, business };
}

export async function buildQaInput(slug: string): Promise<QaInput> {
  const { site, business } = loadGeneratedSite(slug);
  const lead = readLead(slug);
  const deterministicChecks = runDeterministicChecks({
    site,
    business,
    lead,
  });
  const lifecycle = isDatabaseConfigured()
    ? await getDemoLifecycleBySlug(slug)
    : null;

  return {
    lead: {
      slug,
      companyName: lead?.companyName ?? business.companyName ?? slug,
      industry: lead?.industry ?? business.industry ?? null,
      phone: lead?.phone ?? business.phone ?? null,
      address: lead?.address ?? business.address ?? null,
      city: extractCity(lead?.address ?? business.address) ?? business.serviceArea ?? null,
      status: lead?.status ?? null,
    },
    business: toBusinessSlice(business),
    siteCopy: toSiteCopy(site),
    deterministicChecks,
    deployment: {
      path: `/${slug}`,
      liveUrlKnown: Boolean(lifecycle?.publishedAt),
    },
  };
}
