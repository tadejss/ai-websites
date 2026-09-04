import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import {
  WebsiteDomainCollisionError,
  isWebsiteDomainKind,
  isWebsiteDomainStatus,
  type WebsiteDomainKind,
  type WebsiteDomainRecord,
  type WebsiteDomainStatus,
} from "./types";

type DomainRow = {
  id: number | string;
  customer_slug: string;
  hostname: string;
  kind: string;
  status: string;
  canonical: boolean;
  vercel_verified: boolean;
  vercel_error: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIso(value: Date | string | null | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapRow(row: DomainRow): WebsiteDomainRecord {
  return {
    id: Number(row.id),
    customerSlug: row.customer_slug,
    hostname: row.hostname,
    kind: isWebsiteDomainKind(row.kind) ? row.kind : "apex",
    status: isWebsiteDomainStatus(row.status) ? row.status : "pending",
    canonical: Boolean(row.canonical),
    vercelVerified: Boolean(row.vercel_verified),
    vercelError: row.vercel_error,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function requireDb(): Promise<ReturnType<typeof sql>> {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured");
  }
  await ensureCustomerSchema();
  return sql();
}

export async function listWebsiteDomainsForSlug(
  slug: string,
): Promise<WebsiteDomainRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }
  await ensureCustomerSchema();
  const db = sql();
  const rows = (await db`
    SELECT * FROM customer_website_domains
    WHERE customer_slug = ${slug}
    ORDER BY canonical DESC, kind ASC
  `) as DomainRow[];
  return rows.map(mapRow);
}

/**
 * Insert or keep existing row for this customer.
 * UNIQUE(hostname) is authority: another customer's hostname is a collision.
 * Does not reset live/verified state on retry.
 */
export async function upsertWebsiteDomainHost(input: {
  customerSlug: string;
  hostname: string;
  kind: WebsiteDomainKind;
  canonical: boolean;
}): Promise<WebsiteDomainRecord> {
  const db = await requireDb();
  const rows = (await db`
    INSERT INTO customer_website_domains (
      customer_slug,
      hostname,
      kind,
      status,
      canonical,
      vercel_verified,
      created_at,
      updated_at
    )
    VALUES (
      ${input.customerSlug},
      ${input.hostname},
      ${input.kind},
      'pending',
      ${input.canonical},
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (hostname) DO UPDATE SET
      kind = EXCLUDED.kind,
      canonical = EXCLUDED.canonical,
      updated_at = NOW()
    WHERE customer_website_domains.customer_slug = ${input.customerSlug}
    RETURNING *
  `) as DomainRow[];

  if (!rows[0]) {
    throw new WebsiteDomainCollisionError(input.hostname);
  }

  return mapRow(rows[0]);
}

export async function updateWebsiteDomainHost(input: {
  hostname: string;
  customerSlug: string;
  status: WebsiteDomainStatus;
  vercelVerified: boolean;
  vercelError: string | null;
}): Promise<WebsiteDomainRecord | null> {
  const db = await requireDb();
  const rows = (await db`
    UPDATE customer_website_domains
    SET
      status = ${input.status},
      vercel_verified = ${input.vercelVerified},
      vercel_error = ${input.vercelError},
      updated_at = NOW()
    WHERE hostname = ${input.hostname}
      AND customer_slug = ${input.customerSlug}
    RETURNING *
  `) as DomainRow[];
  return rows[0] ? mapRow(rows[0]) : null;
}

/**
 * Live-host lookup for middleware. No schema bootstrap — fail-open on errors.
 */
export async function lookupLiveWebsiteSlug(
  hostname: string,
): Promise<string | null> {
  if (!isDatabaseConfigured() || !hostname) {
    return null;
  }

  try {
    const db = sql();
    const rows = (await db`
      SELECT customer_slug
      FROM customer_website_domains
      WHERE hostname = ${hostname}
        AND status = 'live'
      LIMIT 1
    `) as { customer_slug: string }[];
    return rows[0]?.customer_slug ?? null;
  } catch {
    return null;
  }
}
