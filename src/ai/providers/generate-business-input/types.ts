import type { BusinessInput } from "../../types";
import type { RawBusinessData } from "../../types/raw-business-data";

export type BusinessInputProvider = {
  name: string;
  generateBusinessInput(input: RawBusinessData): Promise<BusinessInput>;
};
