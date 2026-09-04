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
import {
  getSmsLeadState,
  hasActiveOrSentStep,
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
  const demoLifecycle = smsEnabled ? await getDemoLifecycleBySlug(slug) : null;
  const onboarding = isCustomerLead ? await getOnboardingBySlug(slug) : null;
  const smsState = smsEnabled ? await getSmsLeadState(slug) : null;
  const smsMessages = smsEnabled ? await listSmsMessagesForSlug(slug) : [];
  const smsInbound = smsEnabled ? await listInboundForSlug(slug) : [];

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

  const emailBundle = isCustomerLead
    ? await getEmailServiceWithDomain(slug)
    : null;
  const qaLatest =
    smsEnabled && clientSiteExists(slug)
      ? await getQaLatestSummary(slug)
      : null;
  const websiteDomains = isCustomerLead
    ? await listWebsiteDomainsForSlug(slug)
    : [];

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
    smsIneligibility: smsEligibility.ok ? null : smsEligibility.reason,
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
