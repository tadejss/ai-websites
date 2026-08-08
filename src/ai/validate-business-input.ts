import { z } from "zod";
import type { BusinessInput } from "./types";

const requiredText = z.string().trim().min(1).max(200);

// Contact fields stay nullable-by-emptiness on purpose: the prompt instructs
// the model to return "" rather than invent a phone, email or address.
const optionalText = z.string().max(600);

const businessInputSchema = z
  .object({
    companyName: requiredText,
    industry: requiredText,
    tagline: requiredText,
    services: z.array(requiredText).min(1).max(10),
    phone: optionalText,
    email: optionalText,
    address: optionalText,
    openingHours: optionalText,
    sellingPoints: z.array(requiredText).min(1).max(10),
    targetCustomers: optionalText,
    serviceArea: optionalText,
    yearsExperience: optionalText,
    tone: optionalText,
    brandStyle: optionalText,
    competitors: optionalText,
    callToAction: optionalText,
  })
  .strict() satisfies z.ZodType<BusinessInput>;

export function validateBusinessInput(data: unknown): BusinessInput {
  return businessInputSchema.parse(data);
}
