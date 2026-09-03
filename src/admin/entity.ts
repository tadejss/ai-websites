import type { LeadWithCustomerState } from "@/customers/merge";
import type { DemoLifecycleRecord } from "@/demo-lifecycle/types";
import type { OnboardingRecord, OnboardingStatus } from "@/onboarding/types";
import type {
  CustomerDomainRecord,
  EmailMailboxRecord,
  EmailServiceRecord,
} from "@/email/types";
import type { SmsLeadState, SmsMessageRecord, SmsInboundRecord } from "@/outreach/sms/types";
import type { QaLatestSummary } from "@/qa/types";

export const UNIFIED_STAGES = [
  "discovered",
  "generated",
  "published",
  "viewed",
  "purchased",
  "onboarding_pending",
  "onboarding_submitted",
  "ready_for_approval",
  "approved_for_publish",
  "publishing",
  "publish_failed",
  "live",
] as const;

export type UnifiedStage = (typeof UNIFIED_STAGES)[number];

export type TimelineEventKind =
  | "lead_created"
  | "demo_generated"
  | "demo_published"
  | "demo_viewed"
  | "sms_sent"
  | "sms_reply"
  | "purchase"
  | "onboarding_submitted"
  | "onboarding_approved"
  | "publish_started"
  | "publish_live"
  | "publish_failed";

export type TimelineEvent = {
  id: string;
  kind: TimelineEventKind;
  label: string;
  at: string | null;
  detail?: string;
};

export type AdminActionKind =
  | "queue_sms"
  | "retry_sms"
  | "approve_onboarding"
  | "retry_publish"
  | "copy_onboarding_link"
  | "open_demo"
  | "activate_domain"
  | "retry_email_provision"
  | "resend_email_credentials"
  | "run_qa";

export type AdminAction = {
  kind: AdminActionKind;
  label: string;
  enabled: boolean;
  reason?: string;
};

export type AdminEntity = {
  slug: string;
  companyName: string;
  phone: string | null;
  industry: string | null;
  stage: UnifiedStage;
  substates: {
    leadStatus: string;
    smsStatus: string | null;
    lifecycleStatus: string | null;
    onboardingStatus: OnboardingStatus | null;
    isCustomer: boolean;
  };
  timeline: TimelineEvent[];
  actions: AdminAction[];
  lead: LeadWithCustomerState;
  demoLifecycle: DemoLifecycleRecord | null;
  onboarding: OnboardingRecord | null;
  smsState: SmsLeadState | null;
  smsMessages: SmsMessageRecord[];
  smsInbound: SmsInboundRecord[];
  emailDomain: CustomerDomainRecord | null;
  emailService: EmailServiceRecord | null;
  emailMailbox: EmailMailboxRecord | null;
  qaLatest: QaLatestSummary | null;
};

export function unifiedStageLabel(stage: UnifiedStage): string {
  return stage.replaceAll("_", " ").toUpperCase();
}

export function resolveUnifiedStage(input: {
  isCustomer: boolean;
  onboardingStatus: OnboardingStatus | null;
  lifecycle: DemoLifecycleRecord | null;
  hasClientSite: boolean;
}): UnifiedStage {
  if (input.onboardingStatus === "live") {
    return "live";
  }
  if (input.onboardingStatus === "publish_failed") {
    return "publish_failed";
  }
  if (input.onboardingStatus === "publishing") {
    return "publishing";
  }
  if (input.onboardingStatus === "approved_for_publish") {
    return "approved_for_publish";
  }
  if (
    input.onboardingStatus === "ready_for_approval" ||
    input.onboardingStatus === "processing"
  ) {
    return "ready_for_approval";
  }
  if (
    input.onboardingStatus === "submitted" ||
    input.onboardingStatus === "in_progress"
  ) {
    return input.onboardingStatus === "submitted"
      ? "onboarding_submitted"
      : "onboarding_pending";
  }
  if (input.isCustomer) {
    return "purchased";
  }
  if (input.lifecycle?.lifecycleStatus === "purchased") {
    return "purchased";
  }
  if (input.lifecycle?.lifecycleStatus === "viewed") {
    return "viewed";
  }
  if (input.lifecycle?.lifecycleStatus === "published") {
    return "published";
  }
  if (input.lifecycle?.lifecycleStatus === "generated" || input.hasClientSite) {
    return "generated";
  }
  return "discovered";
}

function pushEvent(
  events: TimelineEvent[],
  event: Omit<TimelineEvent, "id"> & { id?: string },
): void {
  events.push({
    id: event.id ?? `${event.kind}-${event.at ?? "unknown"}`,
    kind: event.kind,
    label: event.label,
    at: event.at,
    detail: event.detail,
  });
}

export function buildEntityTimeline(input: {
  lead: LeadWithCustomerState;
  lifecycle: DemoLifecycleRecord | null;
  onboarding: OnboardingRecord | null;
  smsMessages: SmsMessageRecord[];
  smsInbound: SmsInboundRecord[];
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (input.lead.outreach?.initialSentAt) {
    pushEvent(events, {
      kind: "lead_created",
      label: "First outreach",
      at: input.lead.outreach.initialSentAt,
    });
  }

  if (input.lifecycle?.createdAt) {
    pushEvent(events, {
      kind: "demo_generated",
      label: "Demo generated",
      at: input.lifecycle.createdAt,
    });
  }

  if (input.lifecycle?.publishedAt) {
    pushEvent(events, {
      kind: "demo_published",
      label: "Demo published",
      at: input.lifecycle.publishedAt,
    });
  }

  if (input.lifecycle?.firstViewedAt) {
    pushEvent(events, {
      kind: "demo_viewed",
      label: "First demo view",
      at: input.lifecycle.firstViewedAt,
      detail: `${input.lifecycle.viewCount} total views`,
    });
  }

  for (const message of input.smsMessages) {
    if (message.sentAt) {
      pushEvent(events, {
        id: `sms-${message.messageId}`,
        kind: "sms_sent",
        label: `SMS ${message.step} sent`,
        at: message.sentAt,
        detail: message.status,
      });
    }
  }

  for (const inbound of input.smsInbound) {
    pushEvent(events, {
      id: `inbound-${inbound.id}`,
      kind: "sms_reply",
      label: inbound.isOptOut ? "SMS opt-out" : "SMS reply",
      at: inbound.receivedAt,
      detail: inbound.body.slice(0, 120),
    });
  }

  const purchasedAt =
    input.lead.customer?.purchasedAt ??
    input.lifecycle?.purchasedAt ??
    input.lead.purchasedAt;
  if (purchasedAt) {
    pushEvent(events, {
      kind: "purchase",
      label: "Subscription purchased",
      at: purchasedAt,
      detail: input.lead.customer?.subscriptionPlan ?? undefined,
    });
  }

  if (input.onboarding?.submittedAt) {
    pushEvent(events, {
      kind: "onboarding_submitted",
      label: "Onboarding submitted",
      at: input.onboarding.submittedAt,
    });
  }

  if (input.onboarding?.adminApprovedAt) {
    pushEvent(events, {
      kind: "onboarding_approved",
      label: "Admin approved for publish",
      at: input.onboarding.adminApprovedAt,
    });
  }

  if (input.onboarding?.publishStartedAt) {
    pushEvent(events, {
      kind: "publish_started",
      label: "Publish started",
      at: input.onboarding.publishStartedAt,
    });
  }

  if (input.onboarding?.publishedAt && input.onboarding.status === "live") {
    pushEvent(events, {
      kind: "publish_live",
      label: "Site LIVE",
      at: input.onboarding.publishedAt,
      detail: input.onboarding.publishCommitSha?.slice(0, 12),
    });
  }

  if (input.onboarding?.status === "publish_failed") {
    pushEvent(events, {
      kind: "publish_failed",
      label: "Publish failed",
      at: input.onboarding.updatedAt,
      detail: input.onboarding.publishError?.slice(0, 120),
    });
  }

  return events
    .filter((event) => event.at)
    .sort((a, b) => new Date(b.at!).getTime() - new Date(a.at!).getTime());
}

export function buildAdminActions(input: {
  slug: string;
  canQueueSms: boolean;
  canRetrySms: boolean;
  smsIneligibility?: string | null;
  canApprove: boolean;
  canRetryPublish: boolean;
  onboardingUrl: string | null;
  canActivateDomain?: boolean;
  canRetryEmailProvision?: boolean;
  canResendEmailCredentials?: boolean;
  canRunQa?: boolean;
}): AdminAction[] {
  return [
    {
      kind: "queue_sms",
      label: "Queue SMS",
      enabled: input.canQueueSms,
      reason: input.smsIneligibility ?? undefined,
    },
    {
      kind: "retry_sms",
      label: "Retry SMS",
      enabled: input.canRetrySms,
    },
    {
      kind: "approve_onboarding",
      label: "Approve onboarding",
      enabled: input.canApprove,
    },
    {
      kind: "retry_publish",
      label: "Retry publish",
      enabled: input.canRetryPublish,
    },
    {
      kind: "copy_onboarding_link",
      label: "Copy onboarding link",
      enabled: Boolean(input.onboardingUrl),
    },
    {
      kind: "open_demo",
      label: "Open demo",
      enabled: true,
    },
    {
      kind: "activate_domain",
      label: "Activate domain",
      enabled: Boolean(input.canActivateDomain),
    },
    {
      kind: "retry_email_provision",
      label: "Retry email provision",
      enabled: Boolean(input.canRetryEmailProvision),
    },
    {
      kind: "resend_email_credentials",
      label: "Resend email credentials",
      enabled: Boolean(input.canResendEmailCredentials),
    },
    {
      kind: "run_qa",
      label: "Run QA",
      enabled: Boolean(input.canRunQa),
    },
  ];
}
