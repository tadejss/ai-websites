import { config as loadEnv } from "dotenv";
import { getDemoUrl } from "../src/leads/demo-url";
import { getLeadPriority } from "../src/leads/priority";
import { isLeadStatus, LEAD_STATUSES } from "../src/leads/statuses";
import { readAllLeads } from "../src/leads/store";

loadEnv({ path: ".env.local" });

type Priority = "A" | "B" | "C" | "D";

function parseArgs(args: string[]) {
  let status: string | undefined;
  let priorities: Set<Priority> | undefined;
  let noWebsite = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--priority") {
      const raw = args[++i];

      if (!raw) {
        console.error("Missing value for --priority.");
        process.exit(1);
      }

      const values = raw.split(",").map((value) => value.trim().toUpperCase());

      if (values.some((value) => !["A", "B", "C", "D"].includes(value))) {
        console.error("Invalid priority. Allowed: A, B, C, D");
        process.exit(1);
      }

      priorities = new Set(values as Priority[]);
      continue;
    }

    if (arg === "--no-website") {
      noWebsite = true;
      continue;
    }

    if (arg === "--status") {
      status = args[++i];

      if (!status || !isLeadStatus(status)) {
        console.error(
          `Invalid status "${status ?? ""}". Allowed: ${LEAD_STATUSES.join(", ")}`,
        );
        process.exit(1);
      }

      continue;
    }

    // Backwards compatibility:
    // npm run list-leads -- discovered
    if (!arg.startsWith("--") && !status) {
      status = arg;

      if (!isLeadStatus(status)) {
        console.error(
          `Invalid status "${status}". Allowed: ${LEAD_STATUSES.join(", ")}`,
        );
        process.exit(1);
      }

      continue;
    }

    console.error(`Unknown argument: ${arg}`);
    process.exit(1);
  }

  return { status, priorities, noWebsite };
}

const { status, priorities, noWebsite } = parseArgs(process.argv.slice(2));

let shown = 0;

for (const lead of readAllLeads()) {
  const priority = getLeadPriority(lead);

  if (status && lead.status !== status) {
    continue;
  }

  if (priorities && !priorities.has(priority as Priority)) {
    continue;
  }

  if (noWebsite && lead.existingWebsite) {
    continue;
  }

  shown += 1;

  console.log(`${lead.companyName}`);
  console.log(`  ${lead.industry ?? ""}`);
  console.log(
    `  ⭐ ${lead.googleRating ?? "-"} (${lead.googleReviewCount ?? 0} ocen)`,
  );
  console.log(
    `  Website: ${lead.existingWebsite ? lead.existingWebsite : "NI"}`,
  );
  console.log(`  Telefon: ${lead.phone ?? "-"}`);
  console.log(`  Demo: ${getDemoUrl(lead)}`);
  console.log(`  Priority: ${priority}`);
  console.log(`  Status: ${lead.status}`);
  console.log("");
}

if (shown === 0) {
  console.log("No matching leads.");
}
