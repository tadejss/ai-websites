import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const leadsDir = resolve(__dirname, "../src/content/leads");

const leads = readdirSync(leadsDir)
  .filter((file) => file.endsWith(".json"))
  .sort();

for (const file of leads) {
  const lead = JSON.parse(
    readFileSync(resolve(leadsDir, file), "utf8"),
  );

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