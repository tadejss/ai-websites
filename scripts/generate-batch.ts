import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { createClientFromQuery } from "../src/clients/create-client-from-query";
import { isFatalGenerationError } from "../src/clients/fatal-error";
import {
  appendGenerationLog,
  getGenerationLogPath,
} from "../src/logs/generation-log";

const root = resolve(__dirname, "..");

loadEnv({ path: resolve(root, ".env.local") });

const DEFAULT_LIMIT = 10;

type Options = {
  queries: string[];
  limit: number;
};

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

  const ceiling = Number.parseInt(
    process.env.MAX_GENERATIONS_PER_RUN ?? "",
    10,
  );

  if (Number.isFinite(ceiling) && ceiling > 0 && requested > ceiling) {
    console.log(
      `Limit reduced from ${requested} to ${ceiling} by MAX_GENERATIONS_PER_RUN.`,
    );
    return ceiling;
  }

  return requested;
}

function parseOptions(args: string[]): Options {
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
      'Usage: npm run generate-batch -- --file queries.txt [--limit 10]',
    );
    console.error(
      '   or: npm run generate-batch -- "frizer ljubljana" "avtoservis kranj"',
    );
    process.exit(1);
  }

  const selected = queries.slice(0, limit);

  console.log(
    `Queries: ${queries.length}. Generating up to ${selected.length} (limit ${limit}).\n`,
  );

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  let stoppedAt: number | null = null;

  for (const [index, query] of selected.entries()) {
    const startedAt = Date.now();

    try {
      const result = await createClientFromQuery(query);

      appendGenerationLog({
        query,
        outcome: result.outcome === "created" ? "created" : "skipped",
        durationMs: Date.now() - startedAt,
        slug: result.slug,
        companyName: result.companyName,
        googlePlaceId: result.googlePlaceId,
        reason: result.outcome === "skipped" ? result.reason : undefined,
      });

      if (result.outcome === "created") {
        generated += 1;
        console.log(`GENERATED: ${result.companyName} -> ${result.slug}`);
      } else {
        skipped += 1;
        console.log(`SKIPPED: ${result.companyName} - ${result.reason}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      appendGenerationLog({
        query,
        outcome: "failed",
        durationMs: Date.now() - startedAt,
        reason: message,
      });

      if (isFatalGenerationError(error)) {
        console.error(`\nFATAL: ${message}`);
        console.error("Stopping the batch; every remaining query would fail.");
        stoppedAt = index;
        break;
      }

      failed += 1;
      console.log(`FAILED: ${query}\n  Reason: ${message}`);
    }
  }

  const attempted = stoppedAt ?? selected.length;
  const remaining = queries.length - attempted;

  console.log(
    `\nGenerated: ${generated}\nSkipped: ${skipped}\nFailed: ${failed}`,
  );

  if (remaining > 0) {
    console.log(`Not attempted: ${remaining}`);
  }

  console.log(`Log: ${getGenerationLogPath()}`);

  if (stoppedAt !== null) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
