import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import { buildEmailAddress, normalizeDomain } from "./normalize-domain";
import {
  DEFAULT_LOCAL_PART,
  type CustomerDomainRecord,
  type EmailMailboxRecord,
  type EmailServiceRecord,
  type EmailServiceStatus,
  isDomainStatus,
  isEmailServiceStatus,
} from "./types";

type DomainRow = {
  id: number | string;
  customer_slug: string;
  domain: string;
  status: string;
  cloudflare_zone_id: string | null;
  source: string;
  activated_at: Date | string | null;
  last_error: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type ServiceRow = {
  id: number | string;
  customer_slug: string;
  domain_id: number | string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  provider: string;
  status: string;
  last_error: string | null;
  retry_count: number | string;
  next_retry_at: Date | string | null;
  provisioning_step: string | null;
  password_delivered_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  suspended_at: Date | string | null;
  cancelled_at: Date | string | null;
};

type MailboxRow = {
  id: number | string;
  email_service_id: number | string;
  domain_id: number | string;
  local_part: string;
  email_address: string;
  provider_mailbox_id: string | null;
  quota_mb: number | string | null;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
  suspended_at: Date | string | null;
  cancelled_at: Date | string | null;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapDomain(row: DomainRow): CustomerDomainRecord {
  return {
    id: Number(row.id),
    customerSlug: row.customer_slug,
    domain: row.domain,
    status: isDomainStatus(row.status) ? row.status : "pending",
    cloudflareZoneId: row.cloudflare_zone_id,
    source: row.source,
    activatedAt: toIso(row.activated_at),
    lastError: row.last_error,
    createdAt: toIso(row.created_at)!,
    updatedAt: toIso(row.updated_at)!,
  };
}

function mapService(row: ServiceRow): EmailServiceRecord {
  return {
    id: Number(row.id),
    customerSlug: row.customer_slug,
    domainId: row.domain_id != null ? Number(row.domain_id) : null,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripePriceId: row.stripe_price_id,
    provider: row.provider,
    status: isEmailServiceStatus(row.status) ? row.status : "not_requested",
    lastError: row.last_error,
    retryCount: Number(row.retry_count),
    nextRetryAt: toIso(row.next_retry_at),
    provisioningStep: row.provisioning_step,
    passwordDeliveredAt: toIso(row.password_delivered_at),
    createdAt: toIso(row.created_at)!,
    updatedAt: toIso(row.updated_at)!,
    suspendedAt: toIso(row.suspended_at),
    cancelledAt: toIso(row.cancelled_at),
  };
}

function mapMailbox(row: MailboxRow): EmailMailboxRecord {
  return {
    id: Number(row.id),
    emailServiceId: Number(row.email_service_id),
    domainId: Number(row.domain_id),
    localPart: row.local_part,
    emailAddress: row.email_address,
    providerMailboxId: row.provider_mailbox_id,
    quotaMb: row.quota_mb != null ? Number(row.quota_mb) : null,
    status: row.status as EmailMailboxRecord["status"],
    createdAt: toIso(row.created_at)!,
    updatedAt: toIso(row.updated_at)!,
    suspendedAt: toIso(row.suspended_at),
    cancelledAt: toIso(row.cancelled_at),
  };
}

async function requireDb() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required");
  }
  await ensureCustomerSchema();
  return sql();
}

export async function getCustomerDomainBySlug(
  customerSlug: string,
): Promise<CustomerDomainRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    SELECT *
    FROM customer_domains
    WHERE customer_slug = ${customerSlug}
    ORDER BY created_at DESC
    LIMIT 1
  `) as DomainRow[];

  return rows[0] ? mapDomain(rows[0]) : null;
}

export async function upsertCustomerDomain(input: {
  customerSlug: string;
  domain: string;
  source?: string;
}): Promise<CustomerDomainRecord> {
  const normalized = normalizeDomain(input.domain);
  if (!normalized) {
    throw new Error(`Invalid domain: ${input.domain}`);
  }

  const db = await requireDb();
  const rows = (await db`
    INSERT INTO customer_domains (
      customer_slug,
      domain,
      status,
      source,
      created_at,
      updated_at
    )
    VALUES (
      ${input.customerSlug},
      ${normalized},
      'pending',
      ${input.source ?? "onboarding"},
      NOW(),
      NOW()
    )
    ON CONFLICT (customer_slug, domain) DO UPDATE SET
      updated_at = NOW()
    RETURNING *
  `) as DomainRow[];

  return mapDomain(rows[0]);
}

export async function activateCustomerDomain(
  customerSlug: string,
): Promise<CustomerDomainRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    UPDATE customer_domains
    SET
      status = 'active',
      activated_at = COALESCE(activated_at, NOW()),
      last_error = NULL,
      updated_at = NOW()
    WHERE customer_slug = ${customerSlug}
      AND status = 'pending'
    RETURNING *
  `) as DomainRow[];

  if (rows[0]) {
    return mapDomain(rows[0]);
  }

  const existing = await getCustomerDomainBySlug(customerSlug);
  if (existing?.status === "active") {
    return existing;
  }

  return null;
}

export async function setCustomerDomainCloudflareZoneId(
  domainId: number,
  zoneId: string,
): Promise<void> {
  const db = await requireDb();
  await db`
    UPDATE customer_domains
    SET cloudflare_zone_id = ${zoneId}, updated_at = NOW()
    WHERE id = ${domainId}
  `;
}

export async function getEmailServiceBySlug(
  customerSlug: string,
): Promise<EmailServiceRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    SELECT *
    FROM customer_email_services
    WHERE customer_slug = ${customerSlug}
    LIMIT 1
  `) as ServiceRow[];

  return rows[0] ? mapService(rows[0]) : null;
}

export async function getEmailServiceBySubscriptionId(
  stripeSubscriptionId: string,
): Promise<EmailServiceRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    SELECT *
    FROM customer_email_services
    WHERE stripe_subscription_id = ${stripeSubscriptionId}
    LIMIT 1
  `) as ServiceRow[];

  return rows[0] ? mapService(rows[0]) : null;
}

export async function upsertEmailServiceEntitlement(input: {
  customerSlug: string;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  provider?: string;
  status?: EmailServiceStatus;
  domainId?: number | null;
}): Promise<EmailServiceRecord> {
  const db = await requireDb();
  const status = input.status ?? "waiting_for_domain";

  const rows = (await db`
    INSERT INTO customer_email_services (
      customer_slug,
      domain_id,
      stripe_subscription_id,
      stripe_price_id,
      provider,
      status,
      created_at,
      updated_at
    )
    VALUES (
      ${input.customerSlug},
      ${input.domainId ?? null},
      ${input.stripeSubscriptionId ?? null},
      ${input.stripePriceId ?? null},
      ${input.provider ?? "mxroute"},
      ${status},
      NOW(),
      NOW()
    )
    ON CONFLICT (customer_slug) DO UPDATE SET
      domain_id = COALESCE(EXCLUDED.domain_id, customer_email_services.domain_id),
      stripe_subscription_id = COALESCE(
        EXCLUDED.stripe_subscription_id,
        customer_email_services.stripe_subscription_id
      ),
      stripe_price_id = COALESCE(
        EXCLUDED.stripe_price_id,
        customer_email_services.stripe_price_id
      ),
      status = CASE
        WHEN customer_email_services.status IN (
          'active', 'cancelled', 'suspended', 'pending',
          'provisioning', 'dns_configuring', 'verifying', 'failed'
        )
          THEN customer_email_services.status
        ELSE EXCLUDED.status
      END,
      updated_at = NOW()
    RETURNING *
  `) as ServiceRow[];

  return mapService(rows[0]);
}

export async function linkEmailServiceToDomain(input: {
  customerSlug: string;
  domainId: number;
  status?: EmailServiceStatus;
}): Promise<EmailServiceRecord | null> {
  const db = await requireDb();
  const service = await getEmailServiceBySlug(input.customerSlug);
  if (!service) {
    return null;
  }

  const domain = (await db`
    SELECT status FROM customer_domains WHERE id = ${input.domainId} LIMIT 1
  `) as Array<{ status: string }>;

  const domainStatus = domain[0]?.status;
  const nextStatus =
    input.status ??
    (domainStatus === "active" ? "pending" : "waiting_for_domain");

  const rows = (await db`
    UPDATE customer_email_services
    SET
      domain_id = ${input.domainId},
      status = CASE
        WHEN status IN ('active', 'cancelled', 'suspended', 'provisioning', 'dns_configuring', 'verifying', 'failed')
          THEN status
        ELSE ${nextStatus}
      END,
      updated_at = NOW()
    WHERE customer_slug = ${input.customerSlug}
    RETURNING *
  `) as ServiceRow[];

  return rows[0] ? mapService(rows[0]) : null;
}

export async function transitionEmailServiceAfterDomainActivation(
  customerSlug: string,
): Promise<EmailServiceRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    UPDATE customer_email_services
    SET
      status = 'pending',
      next_retry_at = NOW(),
      last_error = NULL,
      updated_at = NOW()
    WHERE customer_slug = ${customerSlug}
      AND status = 'waiting_for_domain'
    RETURNING *
  `) as ServiceRow[];

  return rows[0] ? mapService(rows[0]) : null;
}

export async function updateEmailServiceStatus(input: {
  customerSlug: string;
  status?: EmailServiceStatus;
  provisioningStep?: string | null;
  lastError?: string | null;
  retryCount?: number;
  nextRetryAt?: Date | null;
  passwordDeliveredAt?: Date | null;
  suspendedAt?: Date | null;
  cancelledAt?: Date | null;
}): Promise<EmailServiceRecord | null> {
  const db = await requireDb();
  const current = await getEmailServiceBySlug(input.customerSlug);
  if (!current) return null;

  const rows = (await db`
    UPDATE customer_email_services
    SET
      status = ${input.status ?? current.status},
      provisioning_step = COALESCE(${input.provisioningStep ?? null}, provisioning_step),
      last_error = ${input.lastError ?? null},
      retry_count = COALESCE(${input.retryCount ?? null}, retry_count),
      next_retry_at = ${input.nextRetryAt?.toISOString() ?? null}::timestamptz,
      password_delivered_at = COALESCE(
        ${input.passwordDeliveredAt?.toISOString() ?? null}::timestamptz,
        password_delivered_at
      ),
      suspended_at = COALESCE(
        ${input.suspendedAt?.toISOString() ?? null}::timestamptz,
        suspended_at
      ),
      cancelled_at = COALESCE(
        ${input.cancelledAt?.toISOString() ?? null}::timestamptz,
        cancelled_at
      ),
      updated_at = NOW()
    WHERE customer_slug = ${input.customerSlug}
    RETURNING *
  `) as ServiceRow[];

  return rows[0] ? mapService(rows[0]) : null;
}

export async function resetEmailServiceForRetry(
  customerSlug: string,
): Promise<EmailServiceRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    UPDATE customer_email_services
    SET
      status = 'pending',
      provisioning_step = NULL,
      next_retry_at = NOW(),
      retry_count = 0,
      updated_at = NOW()
    WHERE customer_slug = ${customerSlug}
      AND status = 'failed'
    RETURNING *
  `) as ServiceRow[];

  return rows[0] ? mapService(rows[0]) : null;
}

export async function listDueEmailServices(limit = 20): Promise<EmailServiceRecord[]> {
  const db = await requireDb();
  const rows = (await db`
    SELECT *
    FROM customer_email_services
    WHERE status IN ('pending', 'provisioning', 'dns_configuring', 'verifying', 'failed')
      AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    ORDER BY COALESCE(next_retry_at, created_at) ASC
    LIMIT ${limit}
  `) as ServiceRow[];

  return rows.map(mapService);
}

export async function getMailboxForService(
  emailServiceId: number,
): Promise<EmailMailboxRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    SELECT *
    FROM customer_email_mailboxes
    WHERE email_service_id = ${emailServiceId}
    ORDER BY created_at ASC
    LIMIT 1
  `) as MailboxRow[];

  return rows[0] ? mapMailbox(rows[0]) : null;
}

export async function upsertMailbox(input: {
  emailServiceId: number;
  domainId: number;
  localPart?: string;
  emailAddress?: string;
  providerMailboxId?: string | null;
  quotaMb?: number | null;
  status?: EmailMailboxRecord["status"];
}): Promise<EmailMailboxRecord> {
  const db = await requireDb();
  const localPart = input.localPart ?? DEFAULT_LOCAL_PART;

  const domainRow = (await db`
    SELECT domain FROM customer_domains WHERE id = ${input.domainId} LIMIT 1
  `) as Array<{ domain: string }>;

  const domain = domainRow[0]?.domain;
  if (!domain) {
    throw new Error(`Domain not found: ${input.domainId}`);
  }

  const emailAddress = input.emailAddress ?? buildEmailAddress(domain, localPart);

  const rows = (await db`
    INSERT INTO customer_email_mailboxes (
      email_service_id,
      domain_id,
      local_part,
      email_address,
      provider_mailbox_id,
      quota_mb,
      status,
      created_at,
      updated_at
    )
    VALUES (
      ${input.emailServiceId},
      ${input.domainId},
      ${localPart},
      ${emailAddress},
      ${input.providerMailboxId ?? null},
      ${input.quotaMb ?? null},
      ${input.status ?? "pending"},
      NOW(),
      NOW()
    )
    ON CONFLICT (domain_id, local_part) DO UPDATE SET
      email_service_id = EXCLUDED.email_service_id,
      provider_mailbox_id = COALESCE(
        EXCLUDED.provider_mailbox_id,
        customer_email_mailboxes.provider_mailbox_id
      ),
      quota_mb = COALESCE(EXCLUDED.quota_mb, customer_email_mailboxes.quota_mb),
      status = CASE
        WHEN customer_email_mailboxes.status = 'active'
          THEN customer_email_mailboxes.status
        ELSE EXCLUDED.status
      END,
      updated_at = NOW()
    RETURNING *
  `) as MailboxRow[];

  return mapMailbox(rows[0]);
}

export async function updateMailboxStatus(input: {
  mailboxId: number;
  status: EmailMailboxRecord["status"];
  providerMailboxId?: string | null;
  suspendedAt?: Date | null;
  cancelledAt?: Date | null;
}): Promise<void> {
  const db = await requireDb();
  await db`
    UPDATE customer_email_mailboxes
    SET
      status = ${input.status},
      provider_mailbox_id = COALESCE(
        ${input.providerMailboxId ?? null},
        provider_mailbox_id
      ),
      suspended_at = COALESCE(
        ${input.suspendedAt?.toISOString() ?? null}::timestamptz,
        suspended_at
      ),
      cancelled_at = COALESCE(
        ${input.cancelledAt?.toISOString() ?? null}::timestamptz,
        cancelled_at
      ),
      updated_at = NOW()
    WHERE id = ${input.mailboxId}
  `;
}

export async function getEmailServiceWithDomain(slug: string): Promise<{
  service: EmailServiceRecord;
  domain: CustomerDomainRecord | null;
  mailbox: EmailMailboxRecord | null;
} | null> {
  const service = await getEmailServiceBySlug(slug);
  if (!service) {
    return null;
  }

  let domain: CustomerDomainRecord | null = null;
  if (service.domainId) {
    const db = await requireDb();
    const rows = (await db`
      SELECT * FROM customer_domains WHERE id = ${service.domainId} LIMIT 1
    `) as DomainRow[];
    domain = rows[0] ? mapDomain(rows[0]) : null;
  }

  const mailbox = await getMailboxForService(service.id);
  return { service, domain, mailbox };
}

export async function markEmailSubscriptionLifecycle(input: {
  stripeSubscriptionId: string;
  status: "active" | "suspended" | "cancelled";
}): Promise<EmailServiceRecord | null> {
  const service = await getEmailServiceBySubscriptionId(input.stripeSubscriptionId);
  if (!service) {
    return null;
  }

  const now = new Date();
  if (input.status === "active") {
    if (service.status === "cancelled") {
      return service;
    }
    return updateEmailServiceStatus({
      customerSlug: service.customerSlug,
      status: "active",
      suspendedAt: null,
    });
  }

  if (input.status === "suspended") {
    return updateEmailServiceStatus({
      customerSlug: service.customerSlug,
      status: "suspended",
      suspendedAt: now,
    });
  }

  return updateEmailServiceStatus({
    customerSlug: service.customerSlug,
    status: "cancelled",
    cancelledAt: now,
  });
}
