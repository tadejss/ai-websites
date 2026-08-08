import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isLeadStatus, LEAD_STATUSES } from "../src/leads/statuses";

const [slug, status] = process.argv.slice(2);

if (status && !isLeadStatus(status)) {
  console.error(
    `Invalid status "${status}". Allowed: ${LEAD_STATUSES.join(", ")}`,
  );
  process.exit(1);
}

if (!slug || !status) {
  console.error(
    'Usage: npm run update-lead -- "<slug>" "<status>"',
  );
  process.exit(1);
}

const leadPath = resolve(
  __dirname,
  "../src/content/leads",
  `${slug}.json`,
);

if (!existsSync(leadPath)) {
  console.error(`Lead "${slug}" does not exist.`);
  process.exit(1);
}

const lead = JSON.parse(readFileSync(leadPath, "utf8"));

lead.status = status;

writeFileSync(
  leadPath,
  `${JSON.stringify(lead, null, 2)}\n`,
  "utf8",
);

console.log(`Lead "${slug}" updated to "${status}".`);