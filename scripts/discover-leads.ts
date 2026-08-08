import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { isFatalGenerationError } from "../src/clients/fatal-error";
import { discoverLeads } from "../src/leads/discover";

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

function parseOptions(args: string[]): { queries: string[]; limit: number } {
  const queries: string[] = [];
  let limitArg: string | undefined;

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

    queries.push(arg);
  }

  return { queries, limit: parseLimit(limitArg) };
}

async function main(): Promise<void> {
  const { queries, limit } = parseOptions(process.argv.slice(2));

  if (queries.length === 0) {
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
    `Queries: ${queries.length}. Up to ${limit} results per query.\n`,
  );

  let discovered = 0;
  let skipped = 0;
  let failed = 0;

  for (const query of queries) {
    try {
      const results = await discoverLeads(query, limit);

      const found = results.filter((r) => r.outcome === "discovered").length;
      const known = results.length - found;

      discovered += found;
      skipped += known;

      console.log(
        `${query}: ${results.length} results, ${found} new, ${known} already known`,
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
          `\nDiscovered: ${discovered}\nAlready known: ${skipped}\nFailed: ${failed}`,
        );
        process.exit(1);
      }

      failed += 1;
      console.log(`FAILED: ${query}\n  Reason: ${message}`);
    }
  }

  console.log(
    `\nDiscovered: ${discovered}\nAlready known: ${skipped}\nFailed: ${failed}`,
  );
  console.log("\nNo websites were generated. Review with:");
  console.log("  npm run list-leads -- discovered");
  console.log("  npm run lead-summary");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
