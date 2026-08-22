import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { formatBrandName } from "@/content/brand-name";
import { getSiteConfig } from "@/content/get-site-config";
import { readLead, type LeadRecord } from "./store";

function readBusinessJson(slug: string): Record<string, unknown> | null {
  const path = resolve(process.cwd(), "src/content/clients", slug, "business.json");

  if (!existsSync(path)) {
    return null;
  }

  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function stringField(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** Lead file when present; otherwise a minimal record from site/business config. */
export function resolveCheckoutLead(slug: string): LeadRecord {
  const lead = readLead(slug);

  if (lead) {
    return lead;
  }

  const siteConfig = getSiteConfig(slug);
  const business = readBusinessJson(slug);
  const companyName =
    stringField(business?.companyName) ?? formatBrandName(siteConfig.brand);

  return {
    slug,
    url: `/${slug}`,
    companyName,
    phone: stringField(business?.phone),
    email: stringField(business?.email),
    address: stringField(business?.address),
    industry: stringField(business?.industry),
  };
}
