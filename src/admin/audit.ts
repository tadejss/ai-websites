import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureAdminSchema } from "@/admin/entity-index";
import { ADMIN_COOKIE } from "@/lib/auth";

async function ensureAuditSchema(): Promise<void> {
  await ensureAdminSchema();
}

async function sessionHash(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!session) {
    return null;
  }
  return createHash("sha256").update(session).digest("hex").slice(0, 16);
}

export async function logAdminAction(input: {
  action: string;
  slug?: string;
  result: "ok" | "error";
  detail?: Record<string, unknown>;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  await ensureAuditSchema();
  const hash = await sessionHash();
  const db = sql();
  await db`
    INSERT INTO admin_audit_log (action, slug, session_hash, result, detail)
    VALUES (
      ${input.action},
      ${input.slug ?? null},
      ${hash},
      ${input.result},
      ${input.detail ? JSON.stringify(input.detail) : null}
    )
  `;
}

export type AuditLogRow = {
  id: number;
  action: string;
  slug: string | null;
  result: string;
  createdAt: string;
};

export async function listRecentAuditLogs(limit = 20): Promise<AuditLogRow[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  await ensureAuditSchema();
  const db = sql();
  const rows = (await db`
    SELECT id, action, slug, result, created_at
    FROM admin_audit_log
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as Array<{
    id: number;
    action: string;
    slug: string | null;
    result: string;
    created_at: Date | string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    slug: row.slug,
    result: row.result,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  }));
}
