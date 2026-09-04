export const QA_RUN_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
] as const;

export type QaRunStatus = (typeof QA_RUN_STATUSES)[number];

export const QA_POLICY_STATUSES = ["pass", "fail", "warning"] as const;

export type QaPolicyStatus = (typeof QA_POLICY_STATUSES)[number];

export const QA_TRIGGERS = ["factory", "cli", "admin", "cron"] as const;

export type QaTrigger = (typeof QA_TRIGGERS)[number];

export const QA_SEVERITIES = ["critical", "high", "medium", "low"] as const;

export type QaSeverity = (typeof QA_SEVERITIES)[number];

export const QA_CATEGORIES = ["content", "business", "ux", "technical"] as const;

export type QaCategory = (typeof QA_CATEGORIES)[number];

export const QA_VERIFICATION_STATUSES = ["verified", "not_verified"] as const;

export type QaVerificationStatus = (typeof QA_VERIFICATION_STATUSES)[number];

export const QA_ISSUE_TYPES = [
  "wrong_business_name",
  "wrong_business",
  "wrong_category",
  "wrong_city",
  "wrong_phone",
  "wrong_address",
  "wrong_hours",
  "wrong_service",
  "wrong_contact",
  "template_contamination",
  "generic_copy",
  "unsupported_claim",
  "contradiction",
  "duplicated_text",
  "language",
  "spelling",
  "ux_hero",
  "ux_cta",
  "ux_contact_path",
  "ux_hierarchy",
  "missing_conversion",
  "schema_invalid",
  "quality_problem",
  "missing_image",
  "broken_anchor",
  "technical",
] as const;

export type QaIssueType = (typeof QA_ISSUE_TYPES)[number];

export type QaIssue = {
  id: string;
  severity: QaSeverity;
  category: QaCategory;
  type: QaIssueType;
  field: string;
  message: string;
  evidence: string;
  expected: string;
  actual: string;
  confidence: number;
  verificationStatus: QaVerificationStatus;
  autoFixable: boolean;
  recommendedFix: string;
};

export type GrokQaModelOutput = {
  summary: string;
  issues: QaIssue[];
};

export type QaResult = {
  summary: string;
  issues: QaIssue[];
  score: number;
  policyStatus: QaPolicyStatus;
};

export type QaRunRecord = {
  id: string;
  slug: string;
  contentHash: string;
  factoryRunId: string | null;
  trigger: QaTrigger;
  runStatus: QaRunStatus;
  policyStatus: QaPolicyStatus | null;
  score: number | null;
  summary: string | null;
  resultJson: QaResult | null;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
  attempt: number;
  maxAttempts: number;
  nextRetryAt: string | null;
  lastError: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type QaLatestSummary = {
  runStatus: QaRunStatus;
  policyStatus: QaPolicyStatus | null;
  score: number | null;
  summary: string | null;
  createdAt: string;
  completedAt: string | null;
  runCount: number;
  openIssueCount: number;
  highestSeverity: QaSeverity | null;
  model: string | null;
  issues: QaIssue[];
};

export type QaListSummary = {
  slug: string;
  runStatus: QaRunStatus;
  policyStatus: QaPolicyStatus | null;
  score: number | null;
};

export type IdentityDiff = {
  field: string;
  expected: string;
  actual: string;
  kind: "mismatch" | "unknown";
};

export type DeterministicChecks = {
  schemaValid: boolean;
  schemaError: string | null;
  qualityProblems: string[];
  unsupportedClaims: Array<{ field: string; value: string; reason: string }>;
  identityDiffs: IdentityDiff[];
  brokenAnchors: string[];
  missingImageKeys: string[];
};

export type QaLeadSlice = {
  slug: string;
  companyName: string;
  industry: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  status: string | null;
};

export type QaBusinessSlice = {
  companyName?: string;
  industry?: string;
  tagline?: string;
  services?: string[];
  phone?: string;
  email?: string;
  address?: string;
  openingHours?: string;
  sellingPoints?: string[];
  targetCustomers?: string;
  serviceArea?: string;
  yearsExperience?: string;
  tone?: string;
  callToAction?: string;
};

export type QaSiteCopy = {
  brand: string;
  metadataTitle: string;
  metadataDescription: string;
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  primaryCta: string;
  secondaryCta: string;
  services: Array<{ title: string; description: string }>;
  contactItems: Array<{ label: string; value: string }>;
  pricing: Array<{ name: string; price: string }> | null;
  footerAddress: string;
  visibleCopy: Array<{ field: string; value: string }>;
};

export type QaInput = {
  lead: QaLeadSlice;
  business: QaBusinessSlice;
  siteCopy: QaSiteCopy;
  deterministicChecks: DeterministicChecks;
  deployment: {
    path: string;
    liveUrlKnown: boolean;
  };
};

export type GrokUsage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
};

export type GrokStructuredClient = {
  complete(input: {
    system: string;
    user: string;
    jsonSchema: Record<string, unknown>;
  }): Promise<{ text: string; usage: GrokUsage }>;
};

export function isQaRunStatus(value: string): value is QaRunStatus {
  return (QA_RUN_STATUSES as readonly string[]).includes(value);
}

export function isQaPolicyStatus(value: string): value is QaPolicyStatus {
  return (QA_POLICY_STATUSES as readonly string[]).includes(value);
}

export function isQaTrigger(value: string): value is QaTrigger {
  return (QA_TRIGGERS as readonly string[]).includes(value);
}

export function isQaIssueType(value: string): value is QaIssueType {
  return (QA_ISSUE_TYPES as readonly string[]).includes(value);
}
