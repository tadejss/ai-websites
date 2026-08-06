import { z } from "zod";
import type { BusinessInput } from "./types";

const businessInputSchema = z
  .object({
    companyName: z.string(),
    industry: z.string(),
    tagline: z.string(),
    services: z.array(z.string()),
    phone: z.string(),
    email: z.string(),
    address: z.string(),
    openingHours: z.string(),
    sellingPoints: z.array(z.string()),
    targetCustomers: z.string(),
    serviceArea: z.string(),
    yearsExperience: z.string(),
    tone: z.string(),
    brandStyle: z.string(),
    competitors: z.string(),
    callToAction: z.string(),
  })
  .strict() satisfies z.ZodType<BusinessInput>;

export function validateBusinessInput(data: unknown): BusinessInput {
  return businessInputSchema.parse(data);
}
