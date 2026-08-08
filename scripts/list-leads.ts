import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isLeadStatus, LEAD_STATUSES } from "../src/leads/statuses";

const statusFilter = process.argv[2];

if (statusFilter && !isLeadStatus(statusFilter)) {
  console.error(
    `Invalid status "${statusFilter}". Allowed: ${LEAD_STATUSES.join(", ")}`,
  );
  process.exit(1);
}

const leadsDir = resolve(__dirname, "../src/content/leads");

const leads = readdirSync(leadsDir)
  .filter((file) => file.endsWith(".json"))
  .sort();

let shown = 0;

for (const file of leads) {
  const lead = JSON.parse(
    readFileSync(resolve(leadsDir, file), "utf8"),
  );

  if (statusFilter && lead.status !== statusFilter) {
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
  console.log(`  Demo: ${lead.url ?? ""}`);
  console.log(`  Status: ${lead.status}`);
  console.log("");
}

if (shown === 0) {
  console.log(
    statusFilter ? `No leads with status "${statusFilter}".` : "No leads yet.",
  );
}
