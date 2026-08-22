import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import type { ContactHistoryEntry, LeadOutreach } from "./outreach-types";

export type LeadRecord = {
  slug: string;
  url?: string;
  googlePlaceId?: string;
  companyName?: string;
  industry?: string;
  phone?: string;
  email?: string;
  address?: string;
  googleRating?: string;
  googleReviewCount?: string;
  existingWebsite?: string;
  status?: string;
  notes?: string;
  outreach?: LeadOutreach;
  contactHistory?: ContactHistoryEntry[];
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionPlan?: "monthly" | "yearly";
};

const SALES_OWNED_FIELDS = [
  "status",
  "notes",
  "contactHistory",
  "email",
  "outreach",
  "stripeCustomerId",
  "stripeSubscriptionId",
  "subscriptionPlan",
] as const;

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
    if (!(field in existing)) {
      continue;
    }

    // "discovered" is a lifecycle placeholder rather than a sales state, so
    // generating a site is allowed to move it on. Anything the salesperson
    // set - contacted, interested, customer - always wins.
    if (field === "status" && existing[field] === "discovered") {
      continue;
    }

    // Allow filling in email when previously empty.
    if (
      field === "email" &&
      typeof existing[field] === "string" &&
      existing[field] &&
      !lead.email
    ) {
      merged[field] = existing[field];
      continue;
    }

    merged[field] = existing[field];
  }

  writeFileSync(
    leadPath(lead.slug),
    `${JSON.stringify(merged, null, 2)}\n`,
    "utf8",
  );

  return "updated";
}

/** Atomically patch a lead file. Returns null when the lead does not exist. */
export function patchLead(
  slug: string,
  patch: Partial<LeadRecord>,
): LeadRecord | null {
  const existing = readLeadJson(slug);

  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    ...patch,
    outreach: patch.outreach
      ? { ...(existing.outreach as LeadOutreach | undefined), ...patch.outreach }
      : existing.outreach,
    contactHistory: patch.contactHistory ?? existing.contactHistory,
  };

  writeFileSync(
    leadPath(slug),
    `${JSON.stringify(updated, null, 2)}\n`,
    "utf8",
  );

  return updated as LeadRecord;
}
