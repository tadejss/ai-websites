import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { createClientFromLead } from "../src/clients/create-client-from-lead";
import { isFatalGenerationError } from "../src/clients/fatal-error";
import {
  isLeadIndustryId,
  type LeadIndustryId,
} from "../src/leads/industry-filter";
import { LEAD_PRIORITIES, type LeadPriority } from "../src/leads/priority";
import { selectLeads } from "../src/leads/select";
import { appendGenerationLog, getGenerationLogPath } from "../src/logs/generation-log";

const root = resolve(__dirname, "..");

loadEnv({ path: resolve(root, ".env.local") });

const DEFAULT_LIMIT = 10;

type Options = {
  limit: number;
  priorities?: LeadPriority[];
  withoutWebsiteOnly: boolean;
  dryRun: boolean;
  industry?: LeadIndustryId;
  region?: string;
};

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

function parsePriorities(raw: string | undefined): LeadPriority[] | undefined {
  if (raw === undefined) {
    return undefined;
  }

  const values = raw
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => value.length > 0);

  const invalid = values.filter(
    (value) => !(LEAD_PRIORITIES as readonly string[]).includes(value),
  );

  if (invalid.length > 0) {
    console.error(
      `Error: Invalid priority "${invalid.join(", ")}". Allowed: ${LEAD_PRIORITIES.join(", ")}`,
    );
    process.exit(1);
  }

  return values as LeadPriority[];
}

function parseOptions(args: string[]): Options {
  let limitArg: string | undefined;
  let priorityArg: string | undefined;
  let withoutWebsiteOnly = false;
  let dryRun = false;
  let industry: LeadIndustryId | undefined;
  let region: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--limit") {
      limitArg = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--priority") {
      priorityArg = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--no-website") {
      withoutWebsiteOnly = true;
      continue;
    }

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--industry") {
      const value = args[index + 1] ?? "";
      if (!isLeadIndustryId(value)) {
        console.error(
          `Error: Invalid --industry "${value}". Allowed: frizer, keramicar, elektro, vulkanizer`,
        );
        process.exit(1);
      }
      industry = value;
      index += 1;
      continue;
    }

    if (arg === "--region") {
      region = args[index + 1];
      index += 1;
      continue;
    }

    console.error(`Error: Unknown option "${arg}".`);
    process.exit(1);
  }

  return {
    limit: parseLimit(limitArg),
    priorities: parsePriorities(priorityArg),
    withoutWebsiteOnly,
    dryRun,
    industry,
    region,
  };
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));

  const candidates = selectLeads({
    statuses: ["discovered"],
    priorities: options.priorities,
    // SMS-only business: never spend generation on website/landline leads.
    withoutWebsiteOnly: true,
    requireMobilePhone: true,
    industry: options.industry,
    region: options.region,
  });

  if (candidates.length === 0) {
    console.log("No discovered leads match those filters.");
    return;
  }

  const selected = candidates.slice(0, options.limit);

  console.log(
    `Matching leads: ${candidates.length}. Generating up to ${selected.length} (limit ${options.limit}).\n`,
  );

  if (options.dryRun) {
    for (const lead of selected) {
      console.log(`WOULD GENERATE: ${lead.companyName} -> ${lead.slug}`);
    }
    console.log("\nDry run; nothing was generated.");
    return;
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const lead of selected) {
    const startedAt = Date.now();

    try {
      const result = await createClientFromLead(lead.slug);

      appendGenerationLog({
        query: `lead:${lead.slug}`,
        outcome: result.outcome === "created" ? "created" : "skipped",
        durationMs: Date.now() - startedAt,
        slug: result.slug,
        companyName: result.companyName,
        googlePlaceId: lead.googlePlaceId,
        reason: result.outcome === "skipped" ? result.reason : undefined,
      });

      if (result.outcome === "created") {
        generated += 1;
        console.log(`GENERATED: ${result.companyName} -> ${result.slug}`);
      } else {
        skipped += 1;
        console.log(`SKIPPED: ${result.companyName} - ${result.reason}`);
      }

      await new Promise((resolveSleep) => setTimeout(resolveSleep, 1500));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      appendGenerationLog({
        query: `lead:${lead.slug}`,
        outcome: "failed",
        durationMs: Date.now() - startedAt,
        slug: lead.slug,
        companyName: lead.companyName,
        googlePlaceId: lead.googlePlaceId,
        reason: message,
      });

      if (isFatalGenerationError(error)) {
        console.error(`\nFATAL: ${message}`);
        console.error("Stopping; every remaining lead would fail.");
        console.log(
          `\nGenerated: ${generated}\nSkipped: ${skipped}\nFailed: ${failed}`,
        );
        process.exit(1);
      }

      failed += 1;
      console.log(`FAILED: ${lead.slug}\n  Reason: ${message}`);
    }
  }

  console.log(
    `\nGenerated: ${generated}\nSkipped: ${skipped}\nFailed: ${failed}`,
  );
  console.log(`Log: ${getGenerationLogPath()}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
