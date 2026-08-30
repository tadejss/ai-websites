import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { isFatalGenerationError } from "../src/clients/fatal-error";
import { discoverLeads } from "../src/leads/discover";
import {
  isLeadIndustryId,
  LEAD_INDUSTRY_IDS,
  type LeadIndustryId,
} from "../src/leads/industry-filter";
import { selectLeads } from "../src/leads/select";

const root = resolve(__dirname, "..");

loadEnv({ path: resolve(root, ".env.local") });

const DEFAULT_LIMIT = 20;
const MAX_RESULTS_PER_QUERY = 60;

function readQueriesFile(path: string): string[] {
  const resolved = resolve(root, path);

  if (!existsSync(resolved)) {
    console.error(`Error: Queries file not found: ${path}`);
    process.exit(1);
  }

  return readFileSync(resolved, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function parseLimit(raw: string | undefined): number {
  const requested = raw === undefined ? DEFAULT_LIMIT : Number.parseInt(raw, 10);

  if (!Number.isFinite(requested) || requested <= 0) {
    console.error("Error: --limit expects a positive number.");
    process.exit(1);
  }

  if (requested > MAX_RESULTS_PER_QUERY) {
    console.log(
      `Limit reduced from ${requested} to ${MAX_RESULTS_PER_QUERY}; Google returns at most ${MAX_RESULTS_PER_QUERY} results per query.`,
    );
    return MAX_RESULTS_PER_QUERY;
  }

  return requested;
}

type Options = {
  queries: string[];
  limit: number;
  region?: string;
  withoutWebsiteOnly: boolean;
  untilNoWebsite?: number;
  industry?: LeadIndustryId;
};

function parseUntil(raw: string | undefined): number | undefined {
  if (raw === undefined) {
    return undefined;
  }

  const value = Number.parseInt(raw, 10);

  if (!Number.isFinite(value) || value <= 0) {
    console.error("Error: --until-no-website expects a positive number.");
    process.exit(1);
  }

  return value;
}

function parseOptions(args: string[]): Options {
  const queries: string[] = [];
  let limitArg: string | undefined;
  let region: string | undefined;
  let withoutWebsiteOnly = false;
  let untilArg: string | undefined;
  let industry: LeadIndustryId | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--file") {
      queries.push(...readQueriesFile(args[index + 1] ?? ""));
      index += 1;
      continue;
    }

    if (arg === "--limit") {
      limitArg = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--region") {
      region = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--no-website") {
      withoutWebsiteOnly = true;
      continue;
    }

    if (arg === "--until-no-website") {
      untilArg = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--industry") {
      const value = args[index + 1] ?? "";
      if (!isLeadIndustryId(value)) {
        console.error(
          `Error: Invalid --industry "${value}". Allowed: ${LEAD_INDUSTRY_IDS.join(", ")}`,
        );
        process.exit(1);
      }
      industry = value;
      index += 1;
      continue;
    }

    queries.push(arg);
  }

  return {
    queries,
    limit: parseLimit(limitArg),
    region,
    withoutWebsiteOnly,
    untilNoWebsite: parseUntil(untilArg),
    industry,
  };
}

function countNoWebsiteLeads(options: Options): number {
  return selectLeads({
    statuses: ["discovered"],
    withoutWebsiteOnly: true,
    industry: options.industry,
    region: options.region,
  }).length;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));

  if (options.queries.length === 0) {
    console.error("Error: No queries provided.");
    console.error(
      'Usage: npm run discover-leads -- "frizer Ljubljana" [--limit 20]',
    );
    console.error(
      "   or: npm run discover-leads -- --file data/queries.txt --limit 20",
    );
    process.exit(1);
  }

  console.log(
    `Queries: ${options.queries.length}. Up to ${options.limit} results per query.`,
  );
  if (options.region) {
    console.log(`Region: ${options.region}`);
  }
  if (options.industry) {
    console.log(`Industry: ${options.industry}`);
  }
  if (options.withoutWebsiteOnly) {
    console.log("Saving only businesses without a website.");
  }
  if (options.untilNoWebsite) {
    console.log(
      `Stop when ${options.untilNoWebsite} discovered no-website leads match the filters.`,
    );
  }
  console.log("");

  let discovered = 0;
  let skipped = 0;
  let failed = 0;

  for (const query of options.queries) {
    if (
      options.untilNoWebsite &&
      countNoWebsiteLeads(options) >= options.untilNoWebsite
    ) {
      console.log(
        `Reached ${options.untilNoWebsite} no-website leads; stopping remaining queries.`,
      );
      break;
    }

    try {
      const results = await discoverLeads(query, options.limit, {
        region: options.region,
        withoutWebsiteOnly: options.withoutWebsiteOnly,
        industry: options.industry,
        sourceQuery: query,
      });

      const found = results.filter((r) => r.outcome === "discovered").length;
      const known = results.length - found;

      discovered += found;
      skipped += known;

      console.log(
        `${query}: ${results.length} results, ${found} new, ${known} skipped`,
      );

      for (const result of results) {
        if (result.outcome === "discovered") {
          console.log(`  + ${result.companyName} -> ${result.slug}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (isFatalGenerationError(error)) {
        console.error(`\nFATAL: ${message}`);
        console.error("Stopping; every remaining query would fail.");
        console.log(
          `\nDiscovered: ${discovered}\nSkipped: ${skipped}\nFailed: ${failed}`,
        );
        process.exit(1);
      }

      failed += 1;
      console.log(`FAILED: ${query}\n  Reason: ${message}`);
    }
  }

  const matching = countNoWebsiteLeads(options);

  console.log(
    `\nDiscovered this run: ${discovered}\nSkipped: ${skipped}\nFailed: ${failed}`,
  );
  console.log(
    `Discovered no-website leads matching filters: ${matching}${
      options.untilNoWebsite ? ` / ${options.untilNoWebsite}` : ""
    }`,
  );
  console.log("\nReview with:");
  console.log("  npm run list-leads -- discovered --no-website");
  console.log("  npm run lead-summary");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
