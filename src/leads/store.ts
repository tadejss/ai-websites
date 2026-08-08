import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export type LeadRecord = {
  slug: string;
  url?: string;
  googlePlaceId?: string;
  companyName?: string;
  industry?: string;
  phone?: string;
  address?: string;
  googleRating?: string;
  googleReviewCount?: string;
  existingWebsite?: string;
  status?: string;
  notes?: string;
};

const SALES_OWNED_FIELDS = ["status", "notes", "contactHistory"] as const;

const leadsDir = resolve(__dirname, "../content/leads");

function leadPath(slug: string): string {
  return resolve(leadsDir, `${slug}.json`);
}

function readLeadJson(slug: string): Record<string, unknown> | null {
  const path = leadPath(slug);

  if (!existsSync(path)) {
    return null;
  }

  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

export function readLead(slug: string): LeadRecord | null {
  return readLeadJson(slug) as LeadRecord | null;
}

export function readAllLeads(): LeadRecord[] {
  if (!existsSync(leadsDir)) {
    return [];
  }

  return readdirSync(leadsDir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map(
      (file) =>
        JSON.parse(readFileSync(resolve(leadsDir, file), "utf8")) as LeadRecord,
    );
}

export function findLeadByPlaceId(googlePlaceId: string): LeadRecord | null {
  if (!googlePlaceId) {
    return null;
  }

  return (
    readAllLeads().find((lead) => lead.googlePlaceId === googlePlaceId) ?? null
  );
}

export function saveLead(lead: LeadRecord): "created" | "updated" {
  mkdirSync(leadsDir, { recursive: true });

  const existing = readLeadJson(lead.slug);

  if (!existing) {
    writeFileSync(
      leadPath(lead.slug),
      `${JSON.stringify(lead, null, 2)}\n`,
      "utf8",
    );

    return "created";
  }

  const merged: Record<string, unknown> = { ...existing, ...lead };

  for (const field of SALES_OWNED_FIELDS) {
    if (field in existing) {
      merged[field] = existing[field];
    }
  }

  writeFileSync(
    leadPath(lead.slug),
    `${JSON.stringify(merged, null, 2)}\n`,
    "utf8",
  );

  return "updated";
}
