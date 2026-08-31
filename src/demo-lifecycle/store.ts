import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";
import {
  type DemoLifecycleRecord,
  type DemoLifecycleStatus,
  isDemoLifecycleStatus,
} from "./types";

type LifecycleRow = {
  slug: string;
  lifecycle_status: string;
  created_at: Date | string;
  published_at: Date | string | null;
  first_viewed_at: Date | string | null;
  last_viewed_at: Date | string | null;
  view_count: number;
  purchased_at: Date | string | null;
  updated_at: Date | string;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(value).toISOString();
}

function mapRow(row: LifecycleRow): DemoLifecycleRecord {
  const status = isDemoLifecycleStatus(row.lifecycle_status)
    ? row.lifecycle_status
    : "generated";

  return {
    slug: row.slug,
    lifecycleStatus: status,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    publishedAt: toIso(row.published_at),
    firstViewedAt: toIso(row.first_viewed_at),
    lastViewedAt: toIso(row.last_viewed_at),
    viewCount: row.view_count ?? 0,
    purchasedAt: toIso(row.purchased_at),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  };
}

async function requireDb() {
  if (!isDatabaseConfigured()) {
    return null;
  }
  await ensureCustomerSchema();
  return sql();
}

export async function upsertDemoLifecycleGenerated(
  slug: string,
): Promise<void> {
  const db = await requireDb();
  if (!db) {
    return;
  }

  await db`
    INSERT INTO demo_lifecycle (slug, lifecycle_status, created_at, updated_at)
    VALUES (${slug}, 'generated', NOW(), NOW())
    ON CONFLICT (slug) DO NOTHING
  `;
}

export async function markDemoLifecyclePublished(
  slugs: string[],
  publishedAt?: Date,
): Promise<void> {
  if (slugs.length === 0) {
    return;
  }

  const db = await requireDb();
  if (!db) {
    return;
  }

  const at = publishedAt ?? new Date();

  for (const slug of slugs) {
    await db`
      INSERT INTO demo_lifecycle (
        slug,
        lifecycle_status,
        published_at,
        created_at,
        updated_at
      )
      VALUES (
        ${slug},
        'published',
        ${at.toISOString()}::timestamptz,
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        lifecycle_status = CASE
          WHEN demo_lifecycle.lifecycle_status = 'purchased' THEN 'purchased'
          WHEN demo_lifecycle.lifecycle_status IN ('viewed', 'published') THEN demo_lifecycle.lifecycle_status
          ELSE 'published'
        END,
        published_at = COALESCE(demo_lifecycle.published_at, EXCLUDED.published_at),
        updated_at = NOW()
    `;
  }
}

export async function markDemoLifecyclePurchased(
  slug: string,
  purchasedAt: string | Date,
): Promise<void> {
  const db = await requireDb();
  if (!db) {
    return;
  }

  const at =
    purchasedAt instanceof Date
      ? purchasedAt.toISOString()
      : new Date(purchasedAt).toISOString();

  await db`
    INSERT INTO demo_lifecycle (
      slug,
      lifecycle_status,
      purchased_at,
      created_at,
      updated_at
    )
    VALUES (
      ${slug},
      'purchased',
      ${at}::timestamptz,
      NOW(),
      NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
      lifecycle_status = 'purchased',
      purchased_at = COALESCE(demo_lifecycle.purchased_at, EXCLUDED.purchased_at),
      updated_at = NOW()
  `;
}

export async function getDemoLifecycleBySlug(
  slug: string,
): Promise<DemoLifecycleRecord | null> {
  const db = await requireDb();
  if (!db) {
    return null;
  }

  const rows = (await db`
    SELECT * FROM demo_lifecycle WHERE slug = ${slug} LIMIT 1
  `) as LifecycleRow[];

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getDemoLifecycleBySlugs(
  slugs: string[],
): Promise<Map<string, DemoLifecycleRecord>> {
  const result = new Map<string, DemoLifecycleRecord>();
  if (slugs.length === 0) {
    return result;
  }

  const db = await requireDb();
  if (!db) {
    return result;
  }

  const rows = (await db`
    SELECT * FROM demo_lifecycle WHERE slug = ANY(${slugs})
  `) as LifecycleRow[];

  for (const row of rows) {
    const mapped = mapRow(row);
    result.set(mapped.slug, mapped);
  }

  return result;
}

export type RecordViewResult =
  | { recorded: true; slug: string }
  | { recorded: false; slug: string; reason: string };

/**
 * Insert dedupe row then increment view counters atomically per viewer window.
 */
export async function incrementDemoViewIfNew(
  slug: string,
  viewerKey: string,
  dedupeExpiresAt: Date,
): Promise<RecordViewResult> {
  const db = await requireDb();
  if (!db) {
    return { recorded: false, slug, reason: "database_not_configured" };
  }

  // Best-effort expired dedupe cleanup
  await db`
    DELETE FROM demo_view_dedupe
    WHERE expires_at < NOW()
  `;

  const dedupeInsert = (await db`
    INSERT INTO demo_view_dedupe (slug, viewer_key, expires_at, created_at)
    VALUES (
      ${slug},
      ${viewerKey},
      ${dedupeExpiresAt.toISOString()}::timestamptz,
      NOW()
    )
    ON CONFLICT (slug, viewer_key) DO UPDATE
    SET
      expires_at = EXCLUDED.expires_at,
      created_at = NOW()
    WHERE demo_view_dedupe.expires_at < NOW()
    RETURNING slug
  `) as { slug: string }[];

  if (!dedupeInsert[0]) {
    return { recorded: false, slug, reason: "dedupe_window_active" };
  }

  await db`
    INSERT INTO demo_lifecycle (slug, lifecycle_status, created_at, updated_at)
    VALUES (${slug}, 'published', NOW(), NOW())
    ON CONFLICT (slug) DO NOTHING
  `;

  const updated = (await db`
    UPDATE demo_lifecycle
    SET
      view_count = view_count + 1,
      first_viewed_at = COALESCE(first_viewed_at, NOW()),
      last_viewed_at = NOW(),
      lifecycle_status = CASE
        WHEN lifecycle_status = 'purchased' THEN 'purchased'
        WHEN lifecycle_status IN ('published', 'generated') THEN 'viewed'
        ELSE lifecycle_status
      END,
      updated_at = NOW()
    WHERE slug = ${slug}
      AND lifecycle_status <> 'purchased'
    RETURNING slug
  `) as { slug: string }[];

  if (!updated[0]) {
    return { recorded: false, slug, reason: "purchased_or_missing" };
  }

  return { recorded: true, slug };
}

/** Backfill published_at from factory locks when lifecycle row exists without it. */
export async function backfillPublishedFromFactoryLocks(
  slugs: string[],
): Promise<void> {
  if (slugs.length === 0) {
    return;
  }

  const db = await requireDb();
  if (!db) {
    return;
  }

  await db`
    UPDATE demo_lifecycle AS dl
    SET
      published_at = COALESCE(dl.published_at, fg.updated_at),
      lifecycle_status = CASE
        WHEN dl.lifecycle_status = 'purchased' THEN 'purchased'
        WHEN dl.lifecycle_status = 'generated' THEN 'published'
        ELSE dl.lifecycle_status
      END,
      updated_at = NOW()
    FROM factory_generation_locks AS fg
    WHERE dl.slug = fg.slug
      AND fg.status = 'published'
      AND dl.slug = ANY(${slugs})
      AND dl.published_at IS NULL
  `;
}

export function resolveEffectiveLifecycleStatus(
  record: DemoLifecycleRecord | null,
  isCustomer: boolean,
): DemoLifecycleStatus | null {
  if (isCustomer) {
    return "purchased";
  }
  return record?.lifecycleStatus ?? null;
}
