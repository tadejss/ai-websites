import { randomUUID } from "node:crypto";
import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";

export type QaRunLease = {
  slug: string;
  runId: string;
  workerId: string;
  expiresAt: string;
};

type LeaseRow = {
  slug: string;
  run_id: string;
  worker_id: string;
  expires_at: Date | string;
};

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

async function requireDb() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for Grok QA");
  }
  await ensureCustomerSchema();
  return sql();
}

export async function claimQaRunLease(input: {
  slug: string;
  workerId: string;
  leaseMinutes?: number;
}): Promise<QaRunLease | null> {
  const db = await requireDb();
  const leaseMinutes = input.leaseMinutes ?? 10;
  const runId = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + leaseMinutes * 60_000);

  const existing = (await db`
    SELECT slug, run_id, worker_id, expires_at
    FROM qa_run_lease
    WHERE slug = ${input.slug}
    LIMIT 1
  `) as LeaseRow[];

  if (existing[0]) {
    const expiry = new Date(existing[0].expires_at);
    if (expiry.getTime() > now.getTime()) {
      return null;
    }
  }

  const rows = (await db`
    INSERT INTO qa_run_lease (
      slug,
      run_id,
      worker_id,
      status,
      claimed_at,
      expires_at,
      updated_at
    )
    VALUES (
      ${input.slug},
      ${runId},
      ${input.workerId},
      'claimed',
      NOW(),
      ${expiresAt.toISOString()}::timestamptz,
      NOW()
    )
    ON CONFLICT (slug) DO UPDATE
    SET
      run_id = EXCLUDED.run_id,
      worker_id = EXCLUDED.worker_id,
      status = 'claimed',
      claimed_at = NOW(),
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
    WHERE qa_run_lease.expires_at <= NOW()
    RETURNING slug, run_id, worker_id, expires_at
  `) as LeaseRow[];

  if (!rows[0]) {
    return null;
  }

  return {
    slug: rows[0].slug,
    runId: rows[0].run_id,
    workerId: rows[0].worker_id,
    expiresAt: toIso(rows[0].expires_at),
  };
}

export async function releaseQaRunLease(
  slug: string,
  runId: string,
): Promise<void> {
  const db = await requireDb();
  await db`
    DELETE FROM qa_run_lease
    WHERE slug = ${slug} AND run_id = ${runId}
  `;
}
