import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDemoUrl } from "@/leads/demo-url";
import type { LeadRecord } from "@/leads/store";
import { resolveLeadEmail } from "@/leads/resolve-email";

export type EmailTemplateContext = {
  companyName: string;
  industry?: string;
  city?: string;
  demoUrl: string;
  hasExistingWebsite: boolean;
  recipientEmail: string;
};

function extractCity(address: string | undefined): string | undefined {
  if (!address?.trim()) {
    return undefined;
  }

  const match = address.match(/,\s*(\d{4})\s+([^,]+)/);

  if (match?.[2]) {
    return match[2].trim();
  }

  const parts = address.split(",").map((part) => part.trim());

  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }

  return undefined;
}

function readBusinessCity(slug: string): string | undefined {
  const path = resolve(
    process.cwd(),
    "src/content/clients",
    slug,
    "business.json",
  );

  if (!existsSync(path)) {
    return undefined;
  }

  try {
    const business = JSON.parse(readFileSync(path, "utf8")) as {
      serviceArea?: string;
      address?: string;
    };

    if (business.serviceArea?.trim()) {
      const area = business.serviceArea.trim();
      const cityMatch = area.match(/^([^\s,]+)/);

      if (cityMatch?.[1]) {
        return cityMatch[1];
      }
    }

    return extractCity(business.address);
  } catch {
    return undefined;
  }
}

export function buildEmailTemplateContext(lead: LeadRecord): EmailTemplateContext | null {
  const recipientEmail = resolveLeadEmail(lead);

  if (!recipientEmail) {
    return null;
  }

  const companyName = lead.companyName?.trim() || lead.slug;
  const city = extractCity(lead.address) ?? readBusinessCity(lead.slug);
  const demoUrl = getDemoUrl(lead);

  if (!demoUrl) {
    return null;
  }

  return {
    companyName,
    industry: lead.industry?.trim() || undefined,
    city,
    demoUrl,
    hasExistingWebsite: Boolean(lead.existingWebsite?.trim()),
    recipientEmail,
  };
}
