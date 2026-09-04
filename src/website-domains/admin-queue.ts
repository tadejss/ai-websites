import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import { getOnboardingDesiredDomain } from "@/onboarding/desired-domain";
import {
  ONBOARDING_WEBSITE_DOMAIN_ADMIN_STATUSES,
  canAdminAttachWebsiteDomain,
  type CustomerOnboardingAnswers,
  type OnboardingStatus,
  type ProcessedOnboardingPayload,
} from "@/onboarding/types";
import {
  isWebsiteDomainKind,
  isWebsiteDomainStatus,
  type WebsiteDomainRecord,
} from "./types";

type OnboardingRow = {
  slug: string;
  status: string;
  updated_at: Date | string;
  answers: CustomerOnboardingAnswers | null;
  processed_payload: ProcessedOnboardingPayload | null;
};

type DomainRow = {
  id: number | string;
  customer_slug: string;
  hostname: string;
  kind: string;
  status: string;
  canonical: boolean;
  vercel_verified: boolean;
  vercel_error: string | null;
  updated_at: Date | string;
};

export type WebsiteDomainAttentionState = "failed" | "pending" | "live";

export type WebsiteDomainAdminRow = {
  slug: string;
  companyName: string;
  onboardingStatus: OnboardingStatus;
  desiredDomain: string | null;
  domains: WebsiteDomainRecord[];
  attentionState: WebsiteDomainAttentionState;
  sortUpdatedAt: string;
};

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapDomainRow(row: DomainRow): WebsiteDomainRecord {
  return {
    id: Number(row.id),
    customerSlug: row.customer_slug,
    hostname: row.hostname,
    kind: isWebsiteDomainKind(row.kind) ? row.kind : "apex",
    status: isWebsiteDomainStatus(row.status) ? row.status : "pending",
    canonical: Boolean(row.canonical),
    vercelVerified: Boolean(row.vercel_verified),
    vercelError: row.vercel_error,
    createdAt: toIso(row.updated_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function deriveWebsiteDomainAttentionState(input: {
  onboardingStatus: OnboardingStatus;
  domains: WebsiteDomainRecord[];
}): WebsiteDomainAttentionState {
  if (
    input.onboardingStatus === "publish_failed" ||
    input.domains.some((domain) => domain.status === "failed")
  ) {
    return "failed";
  }

  if (
    input.domains.length === 0 ||
    input.domains.some((domain) => domain.status === "pending")
  ) {
    return "pending";
  }

  return "live";
}

const ATTENTION_SORT: Record<WebsiteDomainAttentionState, number> = {
  failed: 0,
  pending: 1,
  live: 2,
};

export function sortWebsiteDomainAdminRows(
  rows: WebsiteDomainAdminRow[],
): WebsiteDomainAdminRow[] {
  return [...rows].sort((a, b) => {
    const byAttention =
      ATTENTION_SORT[a.attentionState] - ATTENTION_SORT[b.attentionState];
    if (byAttention !== 0) {
      return byAttention;
    }
    return b.sortUpdatedAt.localeCompare(a.sortUpdatedAt);
  });
}

function companyNameFromRow(row: OnboardingRow): string {
  const fromAnswers = row.answers?.companyName?.trim();
  if (fromAnswers) {
    return fromAnswers;
  }
  const fromPayload = row.processed_payload?.businessInput?.companyName;
  if (typeof fromPayload === "string" && fromPayload.trim()) {
    return fromPayload.trim();
  }
  return row.slug;
}

/**
 * Two Neon queries: eligible onboarding rows + domain rows for those slugs.
 */
export async function listWebsiteDomainAdminQueue(): Promise<
  WebsiteDomainAdminRow[]
> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  await ensureCustomerSchema();
  const db = sql();
  const statuses = [...ONBOARDING_WEBSITE_DOMAIN_ADMIN_STATUSES];

  const onboardingRows = (await db`
    SELECT slug, status, updated_at, answers, processed_payload
    FROM customer_onboarding
    WHERE status = ANY(${statuses})
    ORDER BY updated_at DESC
  `) as OnboardingRow[];

  const eligible = onboardingRows.filter((row) =>
    canAdminAttachWebsiteDomain(row.status as OnboardingStatus),
  );

  if (eligible.length === 0) {
    return [];
  }

  const slugs = eligible.map((row) => row.slug);

  const domainRows = (await db`
    SELECT
      id,
      customer_slug,
      hostname,
      kind,
      status,
      canonical,
      vercel_verified,
      vercel_error,
      updated_at
    FROM customer_website_domains
    WHERE customer_slug = ANY(${slugs})
    ORDER BY canonical DESC, kind ASC
  `) as DomainRow[];

  const domainsBySlug = new Map<string, WebsiteDomainRecord[]>();
  for (const row of domainRows) {
    const mapped = mapDomainRow(row);
    const list = domainsBySlug.get(row.customer_slug) ?? [];
    list.push(mapped);
    domainsBySlug.set(row.customer_slug, list);
  }

  const rows: WebsiteDomainAdminRow[] = eligible.map((row) => {
    const onboardingStatus = row.status as OnboardingStatus;
    const domains = domainsBySlug.get(row.slug) ?? [];
    const onboardingUpdatedAt = toIso(row.updated_at);
    const latestDomainAt = domains.reduce(
      (latest, domain) =>
        domain.updatedAt > latest ? domain.updatedAt : latest,
      "",
    );
    const sortUpdatedAt =
      latestDomainAt && latestDomainAt > onboardingUpdatedAt
        ? latestDomainAt
        : onboardingUpdatedAt;

    const onboardingLike = {
      answers: row.answers,
      processedPayload: row.processed_payload,
    };

    return {
      slug: row.slug,
      companyName: companyNameFromRow(row),
      onboardingStatus,
      desiredDomain: getOnboardingDesiredDomain(onboardingLike),
      domains,
      attentionState: deriveWebsiteDomainAttentionState({
        onboardingStatus,
        domains,
      }),
      sortUpdatedAt,
    };
  });

  return sortWebsiteDomainAdminRows(rows);
}
