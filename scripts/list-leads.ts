import { config as loadEnv } from "dotenv";
import { getDemoUrl } from "../src/leads/demo-url";
import { getLeadPriority } from "../src/leads/priority";
import { isLeadStatus, LEAD_STATUSES } from "../src/leads/statuses";
import { readAllLeads } from "../src/leads/store";

loadEnv({ path: ".env.local" });

const statusFilter = process.argv[2];

if (statusFilter && !isLeadStatus(statusFilter)) {
  console.error(
    `Invalid status "${statusFilter}". Allowed: ${LEAD_STATUSES.join(", ")}`,
  );
  process.exit(1);
}

let shown = 0;

for (const lead of readAllLeads()) {
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
  console.log(`  Demo: ${getDemoUrl(lead)}`);
  console.log(`  Priority: ${getLeadPriority(lead)}`);
  console.log(`  Status: ${lead.status}`);
  console.log("");
}

if (shown === 0) {
  console.log(
    statusFilter ? `No leads with status "${statusFilter}".` : "No leads yet.",
  );
}
