import {
  getCustomerDomainBySlug,
  getEmailServiceBySlug,
  linkEmailServiceToDomain,
  upsertCustomerDomain,
  upsertEmailServiceEntitlement,
} from "./store";
import {
  getProfessionalEmailPurchase,
  hasProfessionalEmailEntitlement,
} from "./entitlement";
import { normalizeDomain } from "./normalize-domain";

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
