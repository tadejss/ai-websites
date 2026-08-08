import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { createClientFromLead } from "../src/clients/create-client-from-lead";

const root = resolve(__dirname, "..");

loadEnv({ path: resolve(root, ".env.local") });

async function main(): Promise<void> {
  const slug = process.argv[2];

  if (!slug) {
    console.error("Error: Missing lead slug.");
    console.error("Usage: npm run generate-lead -- <slug>");
    process.exit(1);
  }

  const result = await createClientFromLead(slug);

  if (result.outcome === "skipped") {
    console.error(`Error: "${result.companyName}" ${result.reason}.`);
    process.exit(1);
  }

  console.log(`Client generated: ${result.slug}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
