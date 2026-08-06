import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { generateClient } from "../src/clients/generate-client";
import { createMockSource } from "../src/sources/mock-source";

const root = resolve(__dirname, "..");
const mockSource = createMockSource();

loadEnv({ path: resolve(root, ".env.local") });

async function main(): Promise<void> {
  const slug = process.argv[2];

  if (!slug) {
    console.error("Error: Missing client slug.");
    console.error("Usage: npm run create-client -- <slug>");
    process.exit(1);
  }

  await generateClient(slug, mockSource);
  console.log(`Client generated: ${slug}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
