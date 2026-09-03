export const EMAIL_SERVICE_STATUSES = [
  "not_requested",
  "waiting_for_domain",
  "pending",
  "provisioning",
  "dns_configuring",
  "verifying",
  "active",
  "failed",
  "suspended",
  "cancelled",
] as const;

export type EmailServiceStatus = (typeof EMAIL_SERVICE_STATUSES)[number];

export const DOMAIN_STATUSES = [
  "pending",
  "active",
  "failed",
  "cancelled",
] as const;

export type DomainStatus = (typeof DOMAIN_STATUSES)[number];

export const MAILBOX_STATUSES = [
  "pending",
  "provisioning",
  "active",
  "failed",
  "suspended",
  "cancelled",
] as const;

export type MailboxStatus = (typeof MAILBOX_STATUSES)[number];

export type CustomerDomainRecord = {
  id: number;
  customerSlug: string;
  domain: string;
  status: DomainStatus;
  cloudflareZoneId: string | null;
  source: string;
  activatedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmailServiceRecord = {
  id: number;
  customerSlug: string;
  domainId: number | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  provider: string;
  status: EmailServiceStatus;
  lastError: string | null;
  retryCount: number;
  nextRetryAt: string | null;
  provisioningStep: string | null;
  passwordDeliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  suspendedAt: string | null;
  cancelledAt: string | null;
};

export type EmailMailboxRecord = {
  id: number;
  emailServiceId: number;
  domainId: number;
  localPart: string;
  emailAddress: string;
  providerMailboxId: string | null;
  quotaMb: number | null;
  status: MailboxStatus;
  createdAt: string;
  updatedAt: string;
  suspendedAt: string | null;
  cancelledAt: string | null;
};

export type BusinessEmailCustomerView = {
  status: EmailServiceStatus;
  emailAddress: string | null;
  webmailUrl: string | null;
};

export const DEFAULT_LOCAL_PART = "info";

export const ACTIVATING_STATUSES: EmailServiceStatus[] = [
  "pending",
  "provisioning",
  "dns_configuring",
  "verifying",
];

export function isEmailServiceStatus(value: string): value is EmailServiceStatus {
  return (EMAIL_SERVICE_STATUSES as readonly string[]).includes(value);
}

export function isDomainStatus(value: string): value is DomainStatus {
  return (DOMAIN_STATUSES as readonly string[]).includes(value);
}
