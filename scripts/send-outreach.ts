import { config as loadEnv } from "dotenv";
import { processOutreachBatch } from "../src/outreach/process-batch";
import { sendOutreachToLead } from "../src/outreach/send";
import type { OutreachStep } from "../src/leads/outreach-types";

loadEnv({ path: ".env.local" });

function parseArgs(args: string[]) {
  let slug: string | undefined;
  let step: OutreachStep | undefined;
  let force = false;
  let batch = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--batch") {
      batch = true;
      continue;
    }

    if (arg === "--force") {
      force = true;
      continue;
    }

    if (arg === "--step") {
      const value = args[++i] as OutreachStep | undefined;

      if (!value || !["initial", "followup_1", "followup_2"].includes(value)) {
        console.error("Invalid --step. Use initial, followup_1, or followup_2.");
        process.exit(1);
      }

      step = value;
      continue;
    }

    if (!arg.startsWith("--") && !slug) {
      slug = arg;
      continue;
    }

    console.error(`Unknown argument: ${arg}`);
    process.exit(1);
  }

  return { slug, step, force, batch };
}

async function main() {
  const { slug, step, force, batch } = parseArgs(process.argv.slice(2));

  if (batch) {
    const result = await processOutreachBatch();
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (!slug) {
    console.error(
      'Usage: npm run send-outreach -- <slug> [--step initial|followup_1|followup_2] [--force]\n       npm run send-outreach -- --batch',
    );
    process.exit(1);
  }

  const result = await sendOutreachToLead(slug, { step, force });
  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exit(result.skipped ? 0 : 1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
