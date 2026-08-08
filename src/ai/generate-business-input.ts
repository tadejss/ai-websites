import { isRetryable } from "./generation-error";
import { getBusinessInputProvider } from "./providers/generate-business-input";
import type { BusinessInput } from "./types";
import type { RawBusinessData } from "./types/raw-business-data";
import { validateRawBusinessData } from "./validate-raw-business-data";

export type { BusinessInput } from "./types";
export type { RawBusinessData } from "./types/raw-business-data";

export async function generateBusinessInput(
  input: RawBusinessData,
): Promise<BusinessInput> {
  const validatedInput = validateRawBusinessData(input);
  const provider = getBusinessInputProvider();

  try {
    return await provider.generateBusinessInput(validatedInput);
  } catch (error) {
    if (!isRetryable(error)) {
      throw error;
    }

    return provider.generateBusinessInput(
      validatedInput,
      (error as Error).message,
    );
  }
}
