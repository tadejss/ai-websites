import {
  findCloudflareZoneId,
  upsertEmailDnsRecords,
} from "@/email/dns/cloudflare";
import {
  claimEmailProvisionLease,
  releaseEmailProvisionLease,
} from "@/email/lease";
import { sendMailboxCredentialsEmail } from "@/email/notify-credentials";
import { generateMailboxPassword } from "@/email/password";
import type { EmailProvider } from "@/email/providers/types";
import {
  getEmailProvider,
  getWebmailUrl,
  isEmailProviderConfigured,
} from "@/email/providers";
import {
  getEmailServiceWithDomain,
  listDueEmailServices,
  setCustomerDomainCloudflareZoneId,
  updateEmailServiceStatus,
  updateMailboxStatus,
  upsertMailbox,
} from "@/email/store";
import { hasProfessionalEmailEntitlement } from "@/email/entitlement";
import { DEFAULT_LOCAL_PART, type EmailServiceRecord } from "@/email/types";
import { getOnboardingBySlug } from "@/onboarding/store";

const WORKER_ID = "email-provision-cron";
const MAX_RETRIES = 8;

export type ProvisionDependencies = {
  provider: EmailProvider;
  findZoneId: typeof findCloudflareZoneId;
  upsertDns: typeof upsertEmailDnsRecords;
  sendCredentials: typeof sendMailboxCredentialsEmail;
  hasEntitlement: typeof hasProfessionalEmailEntitlement;
};

function defaultDependencies(): ProvisionDependencies {
  return {
    provider: getEmailProvider(),
    findZoneId: findCloudflareZoneId,
    upsertDns: upsertEmailDnsRecords,
    sendCredentials: sendMailboxCredentialsEmail,
    hasEntitlement: hasProfessionalEmailEntitlement,
  };
}

function computeBackoffMinutes(retryCount: number): number {
  return Math.min(60, Math.pow(2, Math.max(retryCount, 1)) * 5);
}

async function markFailure(
  customerSlug: string,
  step: string,
  error: unknown,
  retryCount: number,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const nextRetry = new Date(
    Date.now() + computeBackoffMinutes(retryCount + 1) * 60_000,
  );

  await updateEmailServiceStatus({
    customerSlug,
    status: "failed",
    provisioningStep: step,
    lastError: message.slice(0, 500),
    retryCount: retryCount + 1,
    nextRetryAt: retryCount + 1 >= MAX_RETRIES ? null : nextRetry,
  });
}

async function ensureProviderDomain(
  domainName: string,
  deps: ProvisionDependencies,
): Promise<void> {
  const existing = await deps.provider.getDomain(domainName);
  if (!existing) {
    await deps.provider.createDomain(domainName);
  }
}

async function ensureProviderMailbox(
  bundle: NonNullable<Awaited<ReturnType<typeof getEmailServiceWithDomain>>>,
  deps: ProvisionDependencies,
): Promise<void> {
  const domainName = bundle.domain!.domain;
  const localPart = bundle.mailbox?.localPart ?? DEFAULT_LOCAL_PART;

  let providerMailbox = await deps.provider.getMailbox(domainName, localPart);
  if (!providerMailbox) {
    const password = generateMailboxPassword();
    providerMailbox = await deps.provider.createMailbox({
      domain: domainName,
      localPart,
      password,
    });
  }

  const mailbox = await upsertMailbox({
    emailServiceId: bundle.service.id,
    domainId: bundle.domain!.id,
    localPart,
    emailAddress: providerMailbox.emailAddress,
    providerMailboxId: providerMailbox.id,
    quotaMb: providerMailbox.quotaMb,
    status: "provisioning",
  });

  await updateMailboxStatus({
    mailboxId: mailbox.id,
    status: "provisioning",
    providerMailboxId: providerMailbox.id,
  });
}

async function configureDns(
  bundle: NonNullable<Awaited<ReturnType<typeof getEmailServiceWithDomain>>>,
  deps: ProvisionDependencies,
): Promise<void> {
  const domainName = bundle.domain!.domain;
  const zoneId =
    bundle.domain!.cloudflareZoneId ?? (await deps.findZoneId(domainName));

  if (!bundle.domain!.cloudflareZoneId) {
    await setCustomerDomainCloudflareZoneId(bundle.domain!.id, zoneId);
  }

  const records = await deps.provider.getDnsRecords(domainName);
  await deps.upsertDns({
    zoneId,
    zoneName: domainName,
    records,
  });
}

async function deliverCredentials(
  bundle: NonNullable<Awaited<ReturnType<typeof getEmailServiceWithDomain>>>,
  deps: ProvisionDependencies,
): Promise<void> {
  const mailbox = bundle.mailbox;
  if (!mailbox) {
    throw new Error("Mailbox record missing during finalize");
  }

  const onboarding = await getOnboardingBySlug(bundle.service.customerSlug);
  const contactEmail =
    onboarding?.contactEmail?.trim() ||
    onboarding?.answers?.email?.trim() ||
    null;

  if (contactEmail && !bundle.service.passwordDeliveredAt) {
    const password = generateMailboxPassword();
    await deps.provider.resetMailboxPassword(
      bundle.domain!.domain,
      mailbox.localPart,
      password,
    );

    const sent = await deps.sendCredentials({
      contactEmail,
      contactName: onboarding?.contactName,
      emailAddress: mailbox.emailAddress,
      password,
      webmailUrl: getWebmailUrl(),
    });

    if (!sent.ok) {
      throw new Error(sent.error);
    }

    await updateEmailServiceStatus({
      customerSlug: bundle.service.customerSlug,
      passwordDeliveredAt: new Date(),
    });
  }

  await updateMailboxStatus({
    mailboxId: mailbox.id,
    status: "active",
  });

  await updateEmailServiceStatus({
    customerSlug: bundle.service.customerSlug,
    status: "active",
    provisioningStep: "complete",
    lastError: null,
    retryCount: 0,
    nextRetryAt: null,
  });
}

export async function advanceEmailProvisionStep(
  customerSlug: string,
  deps: ProvisionDependencies = defaultDependencies(),
): Promise<{ advanced: boolean; status?: string; error?: string }> {
  const bundle = await getEmailServiceWithDomain(customerSlug);
  if (!bundle) {
    return { advanced: false, error: "No email service" };
  }

  const { service } = bundle;

  if (service.status === "cancelled" || service.status === "suspended") {
    return { advanced: false, status: service.status };
  }

  if (!(await deps.hasEntitlement(customerSlug))) {
    await updateEmailServiceStatus({
      customerSlug,
      status: "not_requested",
    });
    return { advanced: false, status: "not_requested" };
  }

  if (!bundle.domain || bundle.domain.status !== "active") {
    if (service.status !== "waiting_for_domain") {
      await updateEmailServiceStatus({
        customerSlug,
        status: "waiting_for_domain",
        provisioningStep: "await_domain",
      });
    }
    return { advanced: false, status: "waiting_for_domain" };
  }

  try {
    if (service.status === "pending" || service.status === "failed") {
      await updateEmailServiceStatus({
        customerSlug,
        status: "provisioning",
        provisioningStep: "provider_domain",
        lastError: null,
      });
    }

    const refreshed = (await getEmailServiceWithDomain(customerSlug))!;
    const currentStep =
      refreshed.service.provisioningStep ?? "provider_domain";
    const currentStatus = refreshed.service.status;

    if (
      currentStatus === "provisioning" &&
      (currentStep === "provider_domain" || !currentStep)
    ) {
      await ensureProviderDomain(refreshed.domain!.domain, deps);
      await updateEmailServiceStatus({
        customerSlug,
        status: "provisioning",
        provisioningStep: "provider_mailbox",
      });
      return { advanced: true, status: "provisioning" };
    }

    const afterDomain = (await getEmailServiceWithDomain(customerSlug))!;
    if (
      afterDomain.service.status === "provisioning" &&
      afterDomain.service.provisioningStep === "provider_mailbox"
    ) {
      await ensureProviderMailbox(afterDomain, deps);
      await updateEmailServiceStatus({
        customerSlug,
        status: "dns_configuring",
        provisioningStep: "cloudflare_dns",
      });
      return { advanced: true, status: "dns_configuring" };
    }

    const forDns = (await getEmailServiceWithDomain(customerSlug))!;
    if (
      forDns.service.status === "dns_configuring" ||
      forDns.service.provisioningStep === "cloudflare_dns"
    ) {
      await configureDns(forDns, deps);
      await updateEmailServiceStatus({
        customerSlug,
        status: "verifying",
        provisioningStep: "verify",
        nextRetryAt: new Date(Date.now() + 5 * 60_000),
      });
      return { advanced: true, status: "verifying" };
    }

    const forVerify = (await getEmailServiceWithDomain(customerSlug))!;
    if (
      forVerify.service.status === "verifying" ||
      forVerify.service.provisioningStep === "verify"
    ) {
      const verified = await deps.provider.isDomainVerified(
        forVerify.domain!.domain,
      );
      if (!verified) {
        await updateEmailServiceStatus({
          customerSlug,
          status: "verifying",
          provisioningStep: "verify",
          nextRetryAt: new Date(Date.now() + 5 * 60_000),
        });
        return { advanced: true, status: "verifying" };
      }

      await deliverCredentials(forVerify, deps);
      return { advanced: true, status: "active" };
    }

    if (forVerify.service.status === "active") {
      return { advanced: false, status: "active" };
    }

    return { advanced: false, status: service.status };
  } catch (error) {
    await markFailure(
      customerSlug,
      service.provisioningStep ?? service.status,
      error,
      service.retryCount,
    );
    const message = error instanceof Error ? error.message : String(error);
    return { advanced: false, status: "failed", error: message };
  }
}

export async function processEmailProvisionBatch(input?: {
  limit?: number;
  workerId?: string;
}): Promise<{
  scanned: number;
  processed: number;
  skipped: number;
  errors: number;
}> {
  if (!isEmailProviderConfigured()) {
    return { scanned: 0, processed: 0, skipped: 0, errors: 0 };
  }

  const limit = input?.limit ?? 20;
  const workerId = input?.workerId ?? WORKER_ID;
  const due = await listDueEmailServices(limit);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const service of due) {
    const lease = await claimEmailProvisionLease({
      slug: service.customerSlug,
      workerId,
    });

    if (!lease) {
      skipped += 1;
      continue;
    }

    try {
      const result = await advanceEmailProvisionStep(service.customerSlug);
      if (result.error) {
        errors += 1;
      } else {
        processed += 1;
      }
    } finally {
      await releaseEmailProvisionLease(service.customerSlug, lease.runId);
    }
  }

  return {
    scanned: due.length,
    processed,
    skipped,
    errors,
  };
}

export async function suspendEmailServiceAtProvider(
  service: EmailServiceRecord,
  deps: ProvisionDependencies = defaultDependencies(),
): Promise<void> {
  const bundle = await getEmailServiceWithDomain(service.customerSlug);
  if (!bundle?.domain || !bundle.mailbox) {
    return;
  }

  await deps.provider.suspendMailbox(
    bundle.domain.domain,
    bundle.mailbox.localPart,
  );
  await updateMailboxStatus({
    mailboxId: bundle.mailbox.id,
    status: "suspended",
    suspendedAt: new Date(),
  });
}

export const MAILBOX_RETENTION_DAYS = 30;

export async function resendMailboxCredentials(
  customerSlug: string,
  deps: ProvisionDependencies = defaultDependencies(),
): Promise<{ ok: true } | { ok: false; error: string }> {
  const bundle = await getEmailServiceWithDomain(customerSlug);
  if (!bundle?.domain || !bundle.mailbox) {
    return { ok: false, error: "Mailbox not provisioned" };
  }

  const onboarding = await getOnboardingBySlug(customerSlug);
  const contactEmail =
    onboarding?.contactEmail?.trim() ||
    onboarding?.answers?.email?.trim() ||
    null;

  if (!contactEmail) {
    return { ok: false, error: "Customer contact email missing" };
  }

  const password = generateMailboxPassword();
  await deps.provider.resetMailboxPassword(
    bundle.domain.domain,
    bundle.mailbox.localPart,
    password,
  );

  const sent = await deps.sendCredentials({
    contactEmail,
    contactName: onboarding?.contactName,
    emailAddress: bundle.mailbox.emailAddress,
    password,
    webmailUrl: getWebmailUrl(),
  });

  if (!sent.ok) {
    return sent;
  }

  await updateEmailServiceStatus({
    customerSlug,
    passwordDeliveredAt: new Date(),
  });

  return { ok: true };
}
