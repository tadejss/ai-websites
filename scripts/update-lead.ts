import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [slug, status] = process.argv.slice(2);

const allowedStatuses = [
  "generated",
  "contacted",
  "interested",
  "customer",
  "rejected",
];

if (status && !allowedStatuses.includes(status)) {
  console.error(
    `Invalid status "${status}". Allowed: ${allowedStatuses.join(", ")}`,
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