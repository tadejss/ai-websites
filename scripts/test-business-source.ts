import { validateRawBusinessData } from "../src/ai/validate-raw-business-data";
import { createMockSource } from "../src/sources/mock-source";

async function main(): Promise<void> {
  const source = createMockSource();
  const result = validateRawBusinessData(await source.getBusiness());
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
