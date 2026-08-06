import type { BusinessInput } from "../../types";

export type BusinessInputProvider = {
  name: string;
  generateBusinessInput(input: string): Promise<BusinessInput>;
};
