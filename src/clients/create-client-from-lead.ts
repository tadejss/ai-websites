import { readLead, type LeadRecord } from "@/leads/store";
import { createLeadEnrichedDetailsSource } from "@/sources/google-places-source";
import { isSmsGenerationCandidate } from "@/outreach/sms/relevance";
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

  if (!isSmsGenerationCandidate(lead)) {
    const reason = lead.existingWebsite?.trim()
      ? "already has a website"
      : "no valid Slovenian mobile phone for SMS";
    return {
      outcome: "skipped",
      reason,
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

  await generateClient(slug, createLeadEnrichedDetailsSource(lead));

  return { outcome: "created", slug, companyName };
}
