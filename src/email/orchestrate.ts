import {
  cancelCustomerDomainById,
  cancelOtherCustomerDomains,
  getCustomerDomainBySlug,
  getEmailServiceBySlug,
  linkEmailServiceToDomain,
  upsertAdminCustomerDomain,
  upsertCustomerDomain,
  upsertEmailServiceEntitlement,
} from "./store";
import {
  getProfessionalEmailPurchase,
  hasProfessionalEmailEntitlement,
} from "./entitlement";
import { normalizeDomain } from "./normalize-domain";
import type { CustomerDomainRecord, EmailServiceRecord } from "./types";

export async function ensureEmailServiceForCustomer(customerSlug: string): Promise<{
  service: Awaited<ReturnType<typeof upsertEmailServiceEntitlement>> | null;
  alreadyExists: boolean;
}> {
  const entitled = await hasProfessionalEmailEntitlement(customerSlug);
  if (!entitled) {
    return { service: null, alreadyExists: false };
  }

  const existing = await getEmailServiceBySlug(customerSlug);
  const purchase = await getProfessionalEmailPurchase(customerSlug);
  const domain = await getCustomerDomainBySlug(customerSlug);

  const status =
    domain?.status === "active" ? "pending" : "waiting_for_domain";

  const service = await upsertEmailServiceEntitlement({
    customerSlug,
    stripeSubscriptionId: purchase?.stripeSubscriptionId ?? null,
    stripePriceId: purchase?.stripePriceId ?? null,
    domainId: domain?.id ?? null,
    status: existing ? existing.status : status,
  });

  return { service, alreadyExists: Boolean(existing) };
}

export async function syncEmailServiceFromOnboarding(input: {
  customerSlug: string;
  desiredDomain: string;
}): Promise<void> {
  const normalized = normalizeDomain(input.desiredDomain);
  if (!normalized) {
    return;
  }

  const entitled = await hasProfessionalEmailEntitlement(input.customerSlug);
  if (!entitled) {
    return;
  }

  const domain = await upsertCustomerDomain({
    customerSlug: input.customerSlug,
    domain: normalized,
    source: "onboarding",
  });

  await ensureEmailServiceForCustomer(input.customerSlug);
  await linkEmailServiceToDomain({
    customerSlug: input.customerSlug,
    domainId: domain.id,
  });
}

function canReplaceEmailDomain(
  service: EmailServiceRecord | null,
): boolean {
  if (!service) {
    return true;
  }
  return (
    service.status === "waiting_for_domain" ||
    service.status === "not_requested"
  );
}

export class AdminEmailDomainError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminEmailDomainError";
    this.status = status;
  }
}

/**
 * Admin set-domain: record a pending customer domain and link the email service.
 * Does NOT activate the domain or start provisioning.
 */
export async function adminSetEmailDomain(input: {
  customerSlug: string;
  domain: string;
}): Promise<{
  domain: CustomerDomainRecord;
  emailService: EmailServiceRecord | null;
}> {
  const normalized = normalizeDomain(input.domain);
  if (!normalized) {
    throw new AdminEmailDomainError("Invalid domain", 400);
  }

  const entitled = await hasProfessionalEmailEntitlement(input.customerSlug);
  if (!entitled) {
    throw new AdminEmailDomainError(
      "Professional email upsell is not purchased",
      409,
    );
  }

  const latestDomain = await getCustomerDomainBySlug(input.customerSlug);
  const existing =
    latestDomain && latestDomain.status !== "cancelled" ? latestDomain : null;
  const service = await getEmailServiceBySlug(input.customerSlug);

  let domain: CustomerDomainRecord;

  if (!existing || existing.domain === normalized) {
    domain = await upsertAdminCustomerDomain({
      customerSlug: input.customerSlug,
      domain: normalized,
    });
  } else if (
    existing.status === "pending" &&
    canReplaceEmailDomain(service)
  ) {
    await cancelCustomerDomainById(existing.id);
    domain = await upsertAdminCustomerDomain({
      customerSlug: input.customerSlug,
      domain: normalized,
    });
  } else {
    throw new AdminEmailDomainError(
      `Email domain already set to ${existing.domain} (${existing.status}); cannot replace`,
      409,
    );
  }

  await cancelOtherCustomerDomains({
    customerSlug: input.customerSlug,
    keepDomainId: domain.id,
  });

  if (!service) {
    await ensureEmailServiceForCustomer(input.customerSlug);
  }

  const linked = await linkEmailServiceToDomain({
    customerSlug: input.customerSlug,
    domainId: domain.id,
  });

  return {
    domain,
    emailService: linked ?? (await getEmailServiceBySlug(input.customerSlug)),
  };
}
