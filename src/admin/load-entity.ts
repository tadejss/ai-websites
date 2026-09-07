import { getLeadWithCustomerState } from "@/customers/merge";
import { isCustomer } from "@/customers/store";
import { clientSiteExists } from "@/leads/client-exists";
import { getDemoUrl } from "@/leads/demo-url";
import { isDatabaseConfigured } from "@/db/client";
import { getDemoLifecycleBySlug } from "@/demo-lifecycle/store";
import { getOnboardingBySlug, getOnboardingUrl } from "@/onboarding/store";
import {
  canAdminApproveOnboarding,
  canRetryCustomerPublish,
} from "@/onboarding/types";
import { evaluateSmsEligibility } from "@/outreach/sms/eligibility";
import { resolveDueSmsStep } from "@/outreach/sms/enqueue-batch";
import { normalizeSlovenianPhone } from "@/outreach/sms/phone";
import { isSmsOptedOutState } from "@/outreach/sms/relevance";
import {
  getSmsLeadState,
  hasActiveOrSentStep,
  isSmsOptedOut,
  listInboundForSlug,
  listSmsMessagesForSlug,
} from "@/outreach/sms/store";
import {
  type AdminEntity,
  buildAdminActions,
  buildEntityTimeline,
  resolveUnifiedStage,
} from "@/admin/entity";
import { getEmailServiceWithDomain } from "@/email/store";
import { getQaLatestSummary } from "@/qa/store";
import { isGrokQaEnabled } from "@/qa/config";
import { listWebsiteDomainsForSlug } from "@/website-domains/store";

export async function loadAdminEntity(slug: string): Promise<AdminEntity | null> {
  const lead = await getLeadWithCustomerState(slug);
  if (!lead) {
    return null;
  }

  const smsEnabled = isDatabaseConfigured();
  const isCustomerLead =
    Boolean(lead.customer) || (await isCustomer(slug));

  const [
    demoLifecycle,
    onboarding,
    smsState,
    smsMessages,
    smsInbound,
    emailBundle,
    qaLatest,
    websiteDomains,
  ] = await Promise.all([
    smsEnabled ? getDemoLifecycleBySlug(slug) : Promise.resolve(null),
    isCustomerLead ? getOnboardingBySlug(slug) : Promise.resolve(null),
    smsEnabled ? getSmsLeadState(slug) : Promise.resolve(null),
    smsEnabled ? listSmsMessagesForSlug(slug) : Promise.resolve([]),
    smsEnabled ? listInboundForSlug(slug) : Promise.resolve([]),
    isCustomerLead
      ? getEmailServiceWithDomain(slug)
      : Promise.resolve(null),
    smsEnabled && clientSiteExists(slug)
      ? getQaLatestSummary(slug)
      : Promise.resolve(null),
    isCustomerLead
      ? listWebsiteDomainsForSlug(slug)
      : Promise.resolve([]),
  ]);

  const smsDueStep = smsEnabled
    ? await resolveDueSmsStep(slug, lead.status)
    : null;
  const smsAlready = smsDueStep
    ? await hasActiveOrSentStep(slug, smsDueStep)
    : false;
  const smsEligibility = evaluateSmsEligibility({
    lead,
    isCustomer: isCustomerLead,
    state: smsState,
    step: smsDueStep ?? "initial",
    alreadySentForStep: smsAlready,
  });
  const lastFailed = smsMessages.find((message) => message.status === "failed");
  const onboardingUrl =
    onboarding != null ? getOnboardingUrl(slug, onboarding.accessToken) : null;

  const normalizedPhone = normalizeSlovenianPhone(lead.phone);
  let smsOptOutIneligibility: string | null = null;
  if (!smsEnabled) {
    smsOptOutIneligibility = "Database not configured";
  } else if (!normalizedPhone.ok) {
    smsOptOutIneligibility = normalizedPhone.error || "Invalid phone number";
  } else if (isSmsOptedOutState(smsState)) {
    smsOptOutIneligibility = "Lead already opted out of SMS";
  } else if (await isSmsOptedOut(normalizedPhone.e164)) {
    smsOptOutIneligibility = "Phone already opted out of SMS";
  }
  const canOptOutSms = smsOptOutIneligibility == null;

  const stage = resolveUnifiedStage({
    isCustomer: isCustomerLead,
    onboardingStatus: onboarding?.status ?? null,
    lifecycle: demoLifecycle,
    hasClientSite: clientSiteExists(slug),
  });

  const timeline = buildEntityTimeline({
    lead,
    lifecycle: demoLifecycle,
    onboarding,
    smsMessages,
    smsInbound,
  });

  const actions = buildAdminActions({
    slug,
    canQueueSms: smsEligibility.ok,
    canRetrySms: Boolean(lastFailed),
    canOptOutSms,
    smsIneligibility: smsEligibility.ok ? null : smsEligibility.reason,
    smsOptOutIneligibility,
    canApprove: onboarding
      ? canAdminApproveOnboarding(onboarding.status)
      : false,
    canRetryPublish: onboarding
      ? canRetryCustomerPublish(onboarding.status)
      : false,
    onboardingUrl,
    canActivateDomain: emailBundle?.domain?.status === "pending",
    canRetryEmailProvision: emailBundle?.service.status === "failed",
    canResendEmailCredentials: emailBundle?.service.status === "active",
    canRunQa: clientSiteExists(slug) && isGrokQaEnabled(),
  });

  return {
    slug,
    companyName: lead.companyName ?? slug,
    phone: lead.phone ?? null,
    industry: lead.industry ?? null,
    stage,
    substates: {
      leadStatus: isCustomerLead ? "customer" : (lead.status ?? "lead"),
      smsStatus: smsState?.smsStatus ?? null,
      lifecycleStatus: demoLifecycle?.lifecycleStatus ?? null,
      onboardingStatus: onboarding?.status ?? null,
      isCustomer: isCustomerLead,
    },
    timeline,
    actions,
    lead,
    demoLifecycle,
    onboarding,
    smsState,
    smsMessages,
    smsInbound,
    emailDomain: emailBundle?.domain ?? null,
    emailService: emailBundle?.service ?? null,
    emailMailbox: emailBundle?.mailbox ?? null,
    websiteDomains,
    qaLatest,
  };
}

export function getEntityDemoUrl(entity: AdminEntity): string {
  return getDemoUrl(entity.lead);
}
