import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { generateBusinessInput } from "../src/ai/generate-business-input";

const root = resolve(__dirname, "..");

loadEnv({ path: resolve(root, ".env.local") });

const input =
  "Avto servis Novak iz Ljubljane. Servisiramo osebna vozila, opravljamo diagnostiko in menjavo pnevmatik. Imamo 20 let izkušenj. Kontakt: 040 123 456.";

async function main(): Promise<void> {
  const result = await generateBusinessInput(input);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
