import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureAdminSchema } from "@/admin/entity-index";

export async function logSystemEvent(input: {
  kind: string;
  message: string;
  slug?: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }
  await ensureAdminSchema();
  const db = sql();
  await db`
    INSERT INTO admin_system_events (kind, slug, message, detail)
    VALUES (
      ${input.kind},
      ${input.slug ?? null},
      ${input.message},
      ${input.detail ? JSON.stringify(input.detail) : null}
    )
  `;
}

export type SystemEventRow = {
  id: number;
  kind: string;
  slug: string | null;
  message: string;
  detail: Record<string, unknown> | null;
  createdAt: string;
};

export async function listSystemEvents(limit = 30): Promise<SystemEventRow[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }
  await ensureAdminSchema();
  const db = sql();
  const rows = (await db`
    SELECT id, kind, slug, message, detail, created_at
    FROM admin_system_events
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as Array<{
    id: number;
    kind: string;
    slug: string | null;
    message: string;
    detail: Record<string, unknown> | null;
    created_at: Date | string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    slug: row.slug,
    message: row.message,
    detail: row.detail,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  }));
}
