import { readLead, type LeadRecord } from "@/leads/store";
import { createPlaceDetailsSource } from "@/sources/google-places-source";
import { clientExists } from "./create-client-from-query";
import { generateClient } from "./generate-client";

export type CreateFromLeadResult =
  | { outcome: "created"; slug: string; companyName: string }
  | { outcome: "skipped"; reason: string; slug: string; companyName: string };

export async function createClientFromLead(
  slug: string,
): Promise<CreateFromLeadResult> {
  const lead: LeadRecord | null = readLead(slug);

  if (!lead) {
    throw new Error(`Lead "${slug}" does not exist`);
  }

  const companyName = lead.companyName ?? slug;

  if (clientExists(slug)) {
    return {
      outcome: "skipped",
      reason: "a site already exists for this lead",
      slug,
      companyName,
    };
  }

  const googlePlaceId = lead.googlePlaceId?.trim();

  if (!googlePlaceId) {
    throw new Error(
      `Lead "${slug}" has no Google Place ID; run npm run backfill-place-ids first`,
    );
  }

  await generateClient(slug, createPlaceDetailsSource(googlePlaceId));

  return { outcome: "created", slug, companyName };
}
