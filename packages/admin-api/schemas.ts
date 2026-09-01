import { z } from "zod";

export const healthPayloadSchema = z.object({
  factory: z.object({ level: z.string(), detail: z.string() }),
  sms: z.object({ level: z.string(), detail: z.string() }),
  gateway: z.object({ level: z.string(), detail: z.string() }),
  dispatch: z.object({ level: z.string(), detail: z.string() }),
});

export const inboxItemSchema = z.object({
  slug: z.string(),
  companyName: z.string(),
  subtitle: z.string(),
  updatedAt: z.string().nullable(),
  href: z.string(),
});

export const inboxResponseSchema = z.object({
  onboardingReview: z.array(inboxItemSchema),
  publishFailed: z.array(inboxItemSchema),
  smsActionable: z.array(inboxItemSchema),
  counts: z.object({
    onboardingReview: z.number(),
    publishFailed: z.number(),
    smsActionable: z.number(),
  }),
  replenish: z.object({
    needed: z.number(),
    actionable: z.number(),
    target: z.number(),
  }),
});

export const searchResultsSchema = z.object({
  results: z.array(
    z.object({
      slug: z.string(),
      companyName: z.string(),
      stage: z.string(),
      href: z.string(),
    }),
  ),
});
