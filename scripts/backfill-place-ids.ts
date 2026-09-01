import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { readAllLeads, saveLead, type LeadRecord } from "../src/leads/store";
import { lookupPlaceId } from "../src/sources/google-places-source";

const root = resolve(__dirname, "..");

loadEnv({ path: resolve(root, ".env.local") });

const DEFAULT_LIMIT = 25;

function parseLimit(args: string[]): number {
  const index = args.indexOf("--limit");

  if (index === -1) {
    return DEFAULT_LIMIT;
  }

  const value = Number.parseInt(args[index + 1] ?? "", 10);

  if (!Number.isFinite(value) || value <= 0) {
    console.error("Error: --limit expects a positive number.");
    process.exit(1);
  }

  return value;
}

function buildSearchQuery(lead: LeadRecord): string {
  return [lead.companyName, lead.address].filter(Boolean).join(" ").trim();
}

async function main(): Promise<void> {
  const limit = parseLimit(process.argv.slice(2));
  const leads = readAllLeads();
  const missing = leads.filter((lead) => !lead.googlePlaceId?.trim());

  if (missing.length === 0) {
    console.log("All leads already have a Google Place ID.");
    return;
  }

  const knownPlaceIds = new Map(
    leads
      .filter((lead) => lead.googlePlaceId?.trim())
      .map((lead) => [lead.googlePlaceId as string, lead.slug]),
  );

  const selected = missing.slice(0, limit);

  console.log(
    `Leads without a Place ID: ${missing.length}. Backfilling ${selected.length} (limit ${limit}).\n`,
  );

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const lead of selected) {
    const query = buildSearchQuery(lead);

    if (!query) {
      console.log(`SKIPPED: ${lead.slug} - no company name or address to search`);
      skipped += 1;
      continue;
    }

    try {
      const placeId = await lookupPlaceId(query);

      if (!placeId) {
        console.log(`SKIPPED: ${lead.slug} - Google returned no Place ID`);
        skipped += 1;
        continue;
      }

      const duplicateOf = knownPlaceIds.get(placeId);

      if (duplicateOf) {
        console.log(
          `SKIPPED: ${lead.slug} - Place ID already belongs to "${duplicateOf}"`,
        );
        skipped += 1;
        continue;
      }

      saveLead({ ...lead, googlePlaceId: placeId });
      knownPlaceIds.set(placeId, lead.slug);
      updated += 1;

      console.log(`UPDATED: ${lead.slug} -> ${placeId}`);
    } catch (error) {
      failed += 1;
      console.log(
        `FAILED: ${lead.slug}\n  Reason: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  const remaining = missing.length - selected.length;

  console.log(`\nUpdated: ${updated}\nSkipped: ${skipped}\nFailed: ${failed}`);

  if (remaining > 0) {
    console.log(`Remaining without a Place ID: ${remaining}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
