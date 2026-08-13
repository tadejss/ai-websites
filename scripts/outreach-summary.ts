import { config as loadEnv } from "dotenv";
import { clientSiteExists } from "../src/leads/client-exists";
import { resolveLeadEmail } from "../src/leads/resolve-email";
import { readAllLeads } from "../src/leads/store";
import {
  getDueOutreachStep,
  getOutreachStatusLabel,
  isLeadEligibleForOutreach,
} from "../src/outreach/eligibility";
import { getOutreachConfig } from "../src/outreach/config";

loadEnv({ path: ".env.local" });

const config = getOutreachConfig();
const leads = readAllLeads();

const eligible = leads.filter(isLeadEligibleForOutreach);
const due = leads.filter((lead) => getDueOutreachStep(lead));
const withEmail = leads.filter((lead) => resolveLeadEmail(lead));
const withWebsite = leads.filter((lead) => clientSiteExists(lead.slug));
const contacted = leads.filter((lead) => lead.outreach?.initialSentAt);

console.log(`Outreach mode: ${config.dryRun ? "DRY RUN" : "LIVE"}`);
console.log(`Total leads: ${leads.length}`);
console.log(`With generated site: ${withWebsite.length}`);
console.log(`With valid email: ${withEmail.length}`);
console.log(`Eligible for outreach: ${eligible.length}`);
console.log(`Due now: ${due.length}`);
console.log(`Initial emails sent: ${contacted.length}`);
console.log("");

for (const lead of due.slice(0, 20)) {
  console.log(
    `${lead.companyName ?? lead.slug} · ${getDueOutreachStep(lead)} · ${getOutreachStatusLabel(lead)} · ${resolveLeadEmail(lead)}`,
  );
}

if (due.length > 20) {
  console.log(`…and ${due.length - 20} more`);
}
