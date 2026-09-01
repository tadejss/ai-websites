import type { AdminEntity } from "@/admin/entity";
import { getEntityDemoUrl } from "@/admin/load-entity";
import { getOnboardingUrl } from "@/onboarding/store";
import { listOnboardingImages } from "@/onboarding/images";
import { resolveDueSmsStep } from "@/outreach/sms/enqueue-batch";
import { isDatabaseConfigured } from "@/db/client";
import type { SmsStep } from "@/outreach/sms/types";

export type SerializedAdminEntity = {
  slug: string;
  companyName: string;
  phone: string | null;
  industry: string | null;
  stage: AdminEntity["stage"];
  demoUrl: string;
  onboardingUrl: string | null;
  smsDueStep: SmsStep | null;
  lastFailedMessageId: string | null;
  substates: AdminEntity["substates"];
  timeline: AdminEntity["timeline"];
  actions: AdminEntity["actions"];
  demoLifecycle: AdminEntity["demoLifecycle"];
  onboarding: {
    status: string;
    contactEmail: string | null;
    submittedAt: string | null;
    publishError: string | null;
    answers: {
      companyName?: string;
      email?: string;
    } | null;
    images: Array<{ url: string; kind: string }>;
  } | null;
  smsMessages: AdminEntity["smsMessages"];
  smsInbound: AdminEntity["smsInbound"];
  customer: {
    subscriptionPlan: string | null;
    purchasedAt: string | null;
    stripeCustomerId: string | null;
  } | null;
};

export async function serializeAdminEntity(
  entity: AdminEntity,
): Promise<SerializedAdminEntity> {
  const smsDueStep = isDatabaseConfigured()
    ? await resolveDueSmsStep(entity.slug, entity.lead.status)
    : null;
  const lastFailed = entity.smsMessages.find(
    (message) => message.status === "failed",
  );

  const onboardingUrl = entity.onboarding
    ? getOnboardingUrl(entity.slug, entity.onboarding.accessToken)
    : null;

  return {
    slug: entity.slug,
    companyName: entity.companyName,
    phone: entity.phone,
    industry: entity.industry,
    stage: entity.stage,
    demoUrl: getEntityDemoUrl(entity),
    onboardingUrl,
    smsDueStep,
    lastFailedMessageId: lastFailed?.messageId ?? null,
    substates: entity.substates,
    timeline: entity.timeline,
    actions: entity.actions,
    demoLifecycle: entity.demoLifecycle,
    onboarding: entity.onboarding
      ? {
          status: entity.onboarding.status,
          contactEmail: entity.onboarding.contactEmail ?? null,
          submittedAt: entity.onboarding.submittedAt ?? null,
          publishError: entity.onboarding.publishError ?? null,
          answers: entity.onboarding.answers
            ? {
                companyName: entity.onboarding.answers.companyName,
                email: entity.onboarding.answers.email,
              }
            : null,
          images: listOnboardingImages(entity.onboarding.answers).map(
            (img) => ({ url: img.url, kind: img.kind }),
          ),
        }
      : null,
    smsMessages: entity.smsMessages,
    smsInbound: entity.smsInbound,
    customer: entity.lead.customer
      ? {
          subscriptionPlan: entity.lead.customer.subscriptionPlan ?? null,
          purchasedAt: entity.lead.customer.purchasedAt ?? null,
          stripeCustomerId: entity.lead.customer.stripeCustomerId ?? null,
        }
      : null,
  };
}
