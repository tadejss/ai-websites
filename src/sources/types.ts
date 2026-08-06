import type { RawBusinessData } from "@/ai/types/raw-business-data";

export type BusinessSource = {
  getBusiness(): Promise<RawBusinessData>;
};
