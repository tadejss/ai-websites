import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getSiteConfig } from "@/content/get-site-config";
import { resolveCheckoutLead } from "@/leads/checkout-lead";
import type { CustomerOnboardingAnswers } from "./types";
import type { OnboardingRecord } from "./types";

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

function stringArrayField(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

function mergeDefined<T extends Record<string, unknown>>(
  base: T,
  patch: Partial<T>,
): T {
  const result = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === "string" && !value.trim()) {
      continue;
    }
    if (Array.isArray(value) && value.length === 0) {
      continue;
    }
    result[key as keyof T] = value as T[keyof T];
  }
  return result;
}

function fromBusinessJson(
  business: Record<string, unknown> | null,
): Partial<CustomerOnboardingAnswers> {
  if (!business) {
    return {};
  }

  return {
    companyName: stringField(business.companyName),
    email: stringField(business.email),
    phone: stringField(business.phone),
    address: stringField(business.address),
    businessDescription: stringField(business.tagline),
    services: stringArrayField(business.services),
    sellingPoints: stringArrayField(business.sellingPoints),
    serviceArea: stringField(business.serviceArea),
    openingHours: stringField(business.openingHours),
  };
}

function fromLeadAndSite(slug: string): Partial<CustomerOnboardingAnswers> {
  const lead = resolveCheckoutLead(slug);
  let brandName: string | undefined;

  try {
    const config = getSiteConfig(slug);
    brandName = `${config.brand.prefix} ${config.brand.highlight}`.trim();
  } catch {
    brandName = undefined;
  }

  return {
    companyName: lead.companyName ?? brandName,
    email: lead.email,
    phone: lead.phone,
    address: lead.address,
  };
}

function fromOnboardingRecord(
  record: OnboardingRecord | null,
): Partial<CustomerOnboardingAnswers> {
  if (!record) {
    return {};
  }

  return {
    companyName: record.contactName ? undefined : undefined,
    contactPerson: record.contactName ?? undefined,
    email: record.contactEmail ?? undefined,
    ...(record.answers ?? {}),
  };
}

/**
 * Prefill order: saved answers win; then Stripe/contact; lead/business; demo.
 * Never overwrite keys already set in saved answers.
 */
export function buildOnboardingPrefill(
  slug: string,
  record: OnboardingRecord | null,
): CustomerOnboardingAnswers {
  const saved = record?.answers ?? {};
  const hasSaved = Object.keys(saved).length > 0;

  const stripeContact: Partial<CustomerOnboardingAnswers> = {
    contactPerson: record?.contactName ?? undefined,
    email: record?.contactEmail ?? undefined,
  };

  const leadSite = fromLeadAndSite(slug);
  const business = fromBusinessJson(readBusinessJson(slug));

  if (hasSaved) {
    return mergeDefined(
      mergeDefined(
        mergeDefined(mergeDefined({}, business), leadSite),
        stripeContact,
      ),
      saved,
    );
  }

  return mergeDefined(
    mergeDefined(mergeDefined(mergeDefined({}, business), leadSite), stripeContact),
    fromOnboardingRecord(record),
  );
}
