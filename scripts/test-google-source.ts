import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { validateRawBusinessData } from "../src/ai/validate-raw-business-data";
import { createGooglePlacesSource } from "../src/sources/google-places-source";

const root = resolve(__dirname, "..");
const query = "Avto servis Novak Ljubljana";

loadEnv({ path: resolve(root, ".env.local") });

async function main(): Promise<void> {
  const source = createGooglePlacesSource(query);
  const result = validateRawBusinessData(await source.getBusiness());
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
