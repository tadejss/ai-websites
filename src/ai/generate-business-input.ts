import { getBusinessInputProvider } from "./providers/generate-business-input";
import type { BusinessInput } from "./types";

export type { BusinessInput } from "./types";

export async function generateBusinessInput(
  input: string,
): Promise<BusinessInput> {
  const provider = getBusinessInputProvider();
  return provider.generateBusinessInput(input);
}
