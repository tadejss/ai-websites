export type HealthLevel = "ok" | "warning" | "failed" | "idle";

export type HealthPayload = {
  factory: { level: HealthLevel; detail: string };
  sms: { level: HealthLevel; detail: string };
  gateway: { level: HealthLevel; detail: string };
  dispatch: { level: HealthLevel; detail: string };
};

export type InboxItem = {
  slug: string;
  companyName: string;
  subtitle: string;
  updatedAt: string | null;
  href: string;
};

export type InboxResponse = {
  onboardingReview: InboxItem[];
  publishFailed: InboxItem[];
  smsActionable: InboxItem[];
  counts: {
    onboardingReview: number;
    publishFailed: number;
    smsActionable: number;
  };
  replenish: {
    needed: number;
    actionable: number;
    target: number;
  };
};

export type SearchResult = {
  slug: string;
  companyName: string;
  stage: string;
  href: string;
};

export type AdminAction = {
  kind: string;
  label: string;
  enabled: boolean;
  reason?: string;
};

export type TimelineEvent = {
  id: string;
  kind: string;
  label: string;
  at: string | null;
  detail?: string;
};

export type AdminEntity = {
  slug: string;
  companyName: string;
  phone: string | null;
  industry: string | null;
  stage: string;
  demoUrl: string;
  onboardingUrl: string | null;
  smsDueStep: string | null;
  lastFailedMessageId: string | null;
  substates: {
    leadStatus: string;
    smsStatus: string | null;
    lifecycleStatus: string | null;
    onboardingStatus: string | null;
    isCustomer: boolean;
  };
  timeline: TimelineEvent[];
  actions: AdminAction[];
  demoLifecycle: {
    viewCount: number;
    publishedAt: string | null;
    firstViewedAt: string | null;
    lastViewedAt: string | null;
    lifecycleStatus: string;
  } | null;
  onboarding: {
    status: string;
    contactEmail: string | null;
    submittedAt: string | null;
    publishError: string | null;
    answers: { companyName?: string; email?: string } | null;
    images: Array<{ url: string; kind: string }>;
  } | null;
  smsMessages: Array<{
    messageId: string;
    step: string;
    status: string;
    sentAt: string | null;
    createdAt: string;
  }>;
  smsInbound: Array<{
    id: number;
    body: string;
    receivedAt: string;
    isOptOut: boolean;
  }>;
  customer: {
    subscriptionPlan: string | null;
    purchasedAt: string | null;
    stripeCustomerId: string | null;
  } | null;
};

export type LeadTableRow = {
  slug: string;
  companyName: string;
  industry: string | null;
  displayStatus: string;
  phone: string | null;
  viewCount: string;
  demoAge: string;
  isNeverViewed: boolean;
};

export type LeadsPageResponse = {
  rows: Array<{
    lead: { slug: string; companyName?: string; industry?: string; phone?: string; status?: string };
    displayStatus: string;
    lifecycle: { viewCount?: number; firstViewedAt?: string; lastViewedAt?: string } | null;
    isNeverViewed: boolean;
    demoAgeDays: number | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PipelineColumn = {
  status: string;
  label: string;
  cards: Array<{
    slug: string;
    companyName: string;
    status: string;
    updatedAt: string;
  }>;
};

export type RevenueAnalytics = {
  mrrEur: number;
  arrEur: number;
  customerCount: number;
  monthlyCount: number;
  yearlyCount: number;
  purchasesThisWeek: number;
  purchasesThisMonth: number;
  upsellCounts: Record<string, number>;
  funnel: {
    published: number;
    viewed: number;
    purchased: number;
    live: number;
  };
  sms: {
    sent: number;
    replied: number;
    optedOut: number;
    replyRate: number;
  };
};

export type AuditLogRow = {
  id: number;
  action: string;
  slug: string | null;
  result: string;
  createdAt: string;
};

export type RevenueResponse = {
  analytics: RevenueAnalytics;
  auditLogs: AuditLogRow[];
};

export type FactorySnapshot = {
  fetchedAt: string;
  health: {
    level: "ok" | "warning" | "failed";
    issues: Array<{ code: string; level: string; message: string }>;
  };
  config: {
    factoryEnabled: boolean;
    dispatchEnabled: boolean;
    dispatchReady: boolean;
    publishEnabled: boolean;
  };
  replenish: {
    actionable: number;
    target: number;
    needed: number;
  };
  worker: {
    activeLease: { status: string; workerId: string; isExpired: boolean } | null;
    consecutiveFailures: number;
    circuitOpen: boolean;
    recentRuns: Array<{
      runId: string;
      startedAt: string;
      status: string;
      demosGenerated: number;
      demosPublished: number;
      demosFailed: number;
      error: string | null;
    }>;
  };
  generationLocks: { staleGenerating: number };
  customerPublish: {
    waitingApproval: number;
    publishFailed: number;
    publishing: number;
    queuedForPublish: number;
    publishFailedRows: Array<{ slug: string; updatedAt: string }>;
  };
  sms: {
    sentToday: number;
    dailyLimit: number;
    gatewayConfigured: boolean;
  };
  demoLifecycle: { publishedNeverViewed: number };
  discovery: {
    combinationsCompleted: number;
    combinationsTotal: number;
    currentRegion: string;
    currentProfession: string;
  };
};
