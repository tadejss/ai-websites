import { z } from "zod";
import type { RawBusinessData } from "./types/raw-business-data";

export const rawBusinessDataSchema = z
  .object({
    name: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    website: z.string().optional(),
    openingHours: z.string().optional(),
    rating: z.string().optional(),
    reviewCount: z.string().optional(),
    reviews: z.array(z.string()).optional(),
  })
  .strict() satisfies z.ZodType<RawBusinessData>;

export function validateRawBusinessData(data: unknown): RawBusinessData {
  return rawBusinessDataSchema.parse(data);
}
