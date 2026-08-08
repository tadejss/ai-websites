import { getLeadPriority, LEAD_PRIORITIES } from "../src/leads/priority";
import { LEAD_STATUSES } from "../src/leads/statuses";
import { readAllLeads } from "../src/leads/store";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const leads = readAllLeads();

console.log(`Total leads: ${leads.length}\n`);

if (leads.length === 0) {
  console.log("No leads yet.");
  process.exit(0);
}

for (const status of LEAD_STATUSES) {
  const count = leads.filter((lead) => lead.status === status).length;
  console.log(`${capitalize(status)}: ${count}`);
}

const unknownStatus = leads.filter(
  (lead) => !LEAD_STATUSES.includes(lead.status as (typeof LEAD_STATUSES)[number]),
).length;

if (unknownStatus > 0) {
  console.log(`Unknown status: ${unknownStatus}`);
}

const withWebsite = leads.filter((lead) => lead.existingWebsite?.trim()).length;

console.log(`\nWithout website: ${leads.length - withWebsite}`);
console.log(`With website: ${withWebsite}`);

const priorities = leads.map((lead) => getLeadPriority(lead));

console.log("");

for (const priority of LEAD_PRIORITIES) {
  const count = priorities.filter((value) => value === priority).length;
  console.log(`Priority ${priority}: ${count}`);
}

const highPriority = priorities.filter(
  (priority) => priority === "A" || priority === "B",
).length;

console.log(`\nHigh priority (A+B): ${highPriority}`);
