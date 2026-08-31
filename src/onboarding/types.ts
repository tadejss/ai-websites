import { z } from "zod";

export const ONBOARDING_STATUSES = [
  "pending",
  "in_progress",
  "submitted",
  "processing",
  "ready_for_approval",
  "approved_for_publish",
  "publishing",
  "publish_failed",
  "live",
] as const;

export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export function isOnboardingStatus(value: string): value is OnboardingStatus {
  return (ONBOARDING_STATUSES as readonly string[]).includes(value);
}

export const onboardingImageSchema = z.object({
  url: z.string().url(),
  fileName: z.string().trim().optional(),
  kind: z.enum(["logo", "photo"]),
});

export type OnboardingImage = z.infer<typeof onboardingImageSchema>;

export const customerOnboardingAnswersSchema = z.object({
  companyName: z.string().trim().optional(),
  contactPerson: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  taxId: z.string().trim().optional(),
  businessDescription: z.string().trim().optional(),
  services: z.array(z.string().trim().min(1)).optional(),
  sellingPoints: z.array(z.string().trim().min(1)).optional(),
  serviceArea: z.string().trim().optional(),
  openingHours: z.string().trim().optional(),
  desiredDomain: z.string().trim().optional(),
  hasExistingDomain: z.boolean().optional(),
  demoChanges: z.string().trim().optional(),
  colorPreferences: z.string().trim().optional(),
  logoUrls: z.array(z.string().url()).optional(),
  photoUrls: z.array(z.string().url()).optional(),
  uploadedImages: z.array(onboardingImageSchema).optional(),
  additionalNotes: z.string().trim().optional(),
});

export type CustomerOnboardingAnswers = z.infer<
  typeof customerOnboardingAnswersSchema
>;

export const customerOnboardingSubmitSchema = customerOnboardingAnswersSchema
  .extend({
    companyName: z.string().trim().min(1, "Ime podjetja je obvezno"),
    email: z.string().trim().email("Veljaven email je obvezen"),
    phone: z.string().trim().min(1, "Telefon je obvezen"),
    businessDescription: z
      .string()
      .trim()
      .min(1, "Kratek opis podjetja je obvezno"),
    services: z
      .array(z.string().trim().min(1))
      .min(1, "Vsaj ena storitev je obvezna"),
    desiredDomain: z.string().trim().min(1, "Želena domena je obvezna"),
  })
  .refine((data) => data.email.length > 0, {
    message: "Email je obvezen",
    path: ["email"],
  });

export type ProcessedOnboardingPayload = {
  slug: string;
  mergedAt: string;
  businessInput: Record<string, unknown>;
  siteHints: {
    desiredDomain: string | null;
    hasExistingDomain: boolean;
    demoChanges: string | null;
    colorPreferences: string | null;
    logoUrls: string[];
    photoUrls: string[];
    uploadedImages: OnboardingImage[];
    additionalNotes: string | null;
  };
};

export type OnboardingRecord = {
  slug: string;
  accessToken: string;
  status: OnboardingStatus;
  answers: CustomerOnboardingAnswers | null;
  processedPayload: ProcessedOnboardingPayload | null;
  contactEmail: string | null;
  contactName: string | null;
  welcomeEmailSentAt: string | null;
  approvalEmailSentAt: string | null;
  adminApprovedAt: string | null;
  adminPublishNotifySentAt: string | null;
  publishStartedAt: string | null;
  publishedAt: string | null;
  publishCommitSha: string | null;
  publishError: string | null;
  submittedAt: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function onboardingStatusLabel(status: OnboardingStatus): string {
  switch (status) {
    case "pending":
      return "PENDING";
    case "in_progress":
      return "IN PROGRESS";
    case "submitted":
      return "SUBMITTED";
    case "processing":
      return "PROCESSING";
    case "ready_for_approval":
      return "READY FOR APPROVAL";
    case "approved_for_publish":
      return "APPROVED FOR PUBLISH";
    case "publishing":
      return "PUBLISHING";
    case "publish_failed":
      return "PUBLISH FAILED";
    case "live":
      return "LIVE";
    default:
      return String(status).toUpperCase();
  }
}

export const ADMIN_APPROVABLE_STATUSES: readonly OnboardingStatus[] = [
  "submitted",
  "processing",
  "ready_for_approval",
] as const;

export function canAdminApproveOnboarding(status: OnboardingStatus): boolean {
  return (ADMIN_APPROVABLE_STATUSES as readonly string[]).includes(status);
}

/** Admin may re-dispatch git publish after a failure or stuck approval. */
export function canRetryCustomerPublish(status: OnboardingStatus): boolean {
  return (
    status === "approved_for_publish" ||
    status === "publish_failed" ||
    status === "publishing"
  );
}

export function isOnboardingLockedForCustomerEdits(
  status: OnboardingStatus,
): boolean {
  return [
    "approved_for_publish",
    "publishing",
    "publish_failed",
    "live",
  ].includes(status);
}
