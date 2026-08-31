import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { BusinessInput } from "@/ai/types";
import {
  getOnboardingBySlug,
  markApprovalEmailSent,
  updateOnboardingStatus,
} from "./store";
import type {
  CustomerOnboardingAnswers,
  ProcessedOnboardingPayload,
} from "./types";
import { listOnboardingImages } from "./images";

function readBusinessJson(slug: string): Record<string, unknown> | null {
  const path = resolve(process.cwd(), "src/content/clients", slug, "business.json");
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function mergeBusinessInput(
  existing: Record<string, unknown> | null,
  answers: CustomerOnboardingAnswers,
): Record<string, unknown> {
  const base: BusinessInput = {
    ...(existing as BusinessInput | null),
  };

  return {
    ...base,
    companyName: answers.companyName ?? base.companyName,
    phone: answers.phone ?? base.phone,
    email: answers.email ?? base.email,
    address: answers.address ?? base.address,
    tagline: answers.businessDescription ?? base.tagline,
    services: answers.services?.length ? answers.services : base.services,
    sellingPoints: answers.sellingPoints?.length
      ? answers.sellingPoints
      : base.sellingPoints,
    serviceArea: answers.serviceArea ?? base.serviceArea,
    openingHours: answers.openingHours ?? base.openingHours,
    targetCustomers: base.targetCustomers,
    tone: base.tone,
    brandStyle: base.brandStyle,
    industry: base.industry,
  };
}

export function buildProcessedPayload(
  slug: string,
  answers: CustomerOnboardingAnswers,
): ProcessedOnboardingPayload {
  const existingBusiness = readBusinessJson(slug);
  const images = listOnboardingImages(answers);

  return {
    slug,
    mergedAt: new Date().toISOString(),
    businessInput: mergeBusinessInput(existingBusiness, answers),
    siteHints: {
      desiredDomain: answers.desiredDomain ?? null,
      hasExistingDomain: answers.hasExistingDomain ?? false,
      demoChanges: answers.demoChanges ?? null,
      colorPreferences: answers.colorPreferences ?? null,
      logoUrls: images.filter((img) => img.kind === "logo").map((img) => img.url),
      photoUrls: images.filter((img) => img.kind === "photo").map((img) => img.url),
      uploadedImages: images,
      additionalNotes: answers.additionalNotes ?? null,
    },
  };
}

export type ProcessOnboardingResult = {
  onboarding: Awaited<ReturnType<typeof updateOnboardingStatus>>;
  alreadyProcessed: boolean;
};

/**
 * Merge onboarding answers with demo business.json (read-only) and store
 * structured payload in Neon. Does NOT write git files or publish LIVE.
 */
export async function processOnboardingSubmission(
  slug: string,
): Promise<ProcessOnboardingResult> {
  const existing = await getOnboardingBySlug(slug);
  if (!existing?.answers) {
    throw new Error(`No onboarding answers for slug "${slug}"`);
  }

  if (
    existing.status === "approved_for_publish" ||
    existing.status === "publishing" ||
    existing.status === "publish_failed" ||
    existing.status === "live"
  ) {
    return { onboarding: existing, alreadyProcessed: true };
  }

  await updateOnboardingStatus(slug, "processing");

  const processedPayload = buildProcessedPayload(slug, existing.answers);
  const onboarding = await updateOnboardingStatus(slug, "ready_for_approval", {
    processedPayload,
    processedAt: new Date(),
  });

  return { onboarding, alreadyProcessed: false };
}

export async function shouldSendApprovalEmail(
  slug: string,
): Promise<boolean> {
  const record = await getOnboardingBySlug(slug);
  return Boolean(record && !record.approvalEmailSentAt);
}

export async function recordApprovalEmailSent(slug: string): Promise<void> {
  await markApprovalEmailSent(slug);
}
