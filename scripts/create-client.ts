import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { createClientFromQuery } from "../src/clients/create-client-from-query";

const root = resolve(__dirname, "..");

loadEnv({ path: resolve(root, ".env.local") });

async function main(): Promise<void> {
  const query = process.argv.slice(2).join(" ").trim();

  if (!query) {
    console.error("Error: Missing business search query.");
    console.error('Usage: npm run create-client -- "<business search query>"');
    process.exit(1);
  }

  const result = await createClientFromQuery(query);

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
