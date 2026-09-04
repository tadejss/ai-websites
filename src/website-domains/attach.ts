import { parseWebsiteHostPair } from "./hostname";
import {
  invalidateWebsiteDomainLookupCache,
} from "./lookup-cache";
import {
  listWebsiteDomainsForSlug,
  updateWebsiteDomainHost,
  upsertWebsiteDomainHost,
} from "./store";
import type { WebsiteDomainRecord } from "./types";
import { WebsiteDomainCollisionError, WebsiteDomainValidationError } from "./types";
import {
  addAndVerifyVercelDomain,
  isVercelDomainConfigured,
  VercelDomainConfigError,
  VercelDomainRequestError,
} from "./vercel";

export type AttachWebsiteDomainResult = {
  domains: WebsiteDomainRecord[];
  error: string | null;
};

function safeErrorMessage(error: unknown): string {
  if (error instanceof WebsiteDomainCollisionError) {
    return error.message;
  }
  if (error instanceof WebsiteDomainValidationError) {
    return error.message;
  }
  if (error instanceof VercelDomainConfigError) {
    return error.message;
  }
  if (error instanceof VercelDomainRequestError) {
    return error.message;
  }
  return "Could not connect the domain.";
}

export function shouldSkipVercelReconcile(
  row: Pick<WebsiteDomainRecord, "status" | "vercelVerified"> | undefined,
): boolean {
  return row?.status === "live" && row.vercelVerified === true;
}

async function reconcileHost(input: {
  customerSlug: string;
  hostname: string;
}): Promise<WebsiteDomainRecord | null> {
  try {
    const vercel = await addAndVerifyVercelDomain(input.hostname);
    return updateWebsiteDomainHost({
      hostname: input.hostname,
      customerSlug: input.customerSlug,
      status: vercel.verified ? "live" : "pending",
      vercelVerified: vercel.verified,
      vercelError: vercel.verified
        ? null
        : "Domain is not verified on Vercel yet.",
    });
  } catch (error) {
    return updateWebsiteDomainHost({
      hostname: input.hostname,
      customerSlug: input.customerSlug,
      status: "failed",
      vercelVerified: false,
      vercelError: safeErrorMessage(error),
    });
  }
}

/**
 * Idempotent attach: upsert apex+www, add/verify each on Vercel, reconcile DB.
 * Retry-safe when apex already exists on Vercel and www previously timed out.
 */
export async function attachWebsiteDomain(input: {
  customerSlug: string;
  hostname: string;
}): Promise<AttachWebsiteDomainResult> {
  const pair = parseWebsiteHostPair(input.hostname);

  await upsertWebsiteDomainHost({
    customerSlug: input.customerSlug,
    hostname: pair.apex,
    kind: "apex",
    canonical: true,
  });
  await upsertWebsiteDomainHost({
    customerSlug: input.customerSlug,
    hostname: pair.www,
    kind: "www",
    canonical: false,
  });

  if (!isVercelDomainConfigured()) {
    const domains = await listWebsiteDomainsForSlug(input.customerSlug);
    return {
      domains,
      error: "Vercel is not configured for custom domains.",
    };
  }

  const existing = await listWebsiteDomainsForSlug(input.customerSlug);
  for (const hostname of [pair.apex, pair.www]) {
    const row = existing.find((domain) => domain.hostname === hostname);
    if (shouldSkipVercelReconcile(row)) {
      continue;
    }
    await reconcileHost({
      customerSlug: input.customerSlug,
      hostname,
    });
  }

  invalidateWebsiteDomainLookupCache();

  const pairHosts = new Set([pair.apex, pair.www]);
  const domains = await listWebsiteDomainsForSlug(input.customerSlug);
  const failed = domains.find(
    (domain) => pairHosts.has(domain.hostname) && domain.status === "failed",
  );
  const pending = domains.find(
    (domain) => pairHosts.has(domain.hostname) && domain.status === "pending",
  );

  let error: string | null = null;
  if (failed) {
    error = failed.vercelError ?? "Could not connect the domain.";
  } else if (pending) {
    error = pending.vercelError ?? "Domain is not verified on Vercel yet.";
  }

  return { domains, error };
}
