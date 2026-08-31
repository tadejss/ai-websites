import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";

export type DemoLifecycleOpsAggregates = {
  byStatus: Record<string, number>;
  totalPublished: number;
  publishedNeverViewed: number;
  viewedNotPurchased: number;
  oldestGeneratedUnpublished: { slug: string; createdAt: string } | null;
  oldestNeverViewed: { slug: string; publishedAt: string } | null;
};

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function getDemoLifecycleOpsAggregates(): Promise<DemoLifecycleOpsAggregates> {
  if (!isDatabaseConfigured()) {
    return {
      byStatus: {},
      totalPublished: 0,
      publishedNeverViewed: 0,
      viewedNotPurchased: 0,
      oldestGeneratedUnpublished: null,
      oldestNeverViewed: null,
    };
  }

  await ensureCustomerSchema();
  const db = sql();

  const statusRows = (await db`
    SELECT lifecycle_status, COUNT(*)::int AS count
    FROM demo_lifecycle
    GROUP BY lifecycle_status
  `) as Array<{ lifecycle_status: string; count: number }>;

  const totalPublishedRows = (await db`
    SELECT COUNT(*)::int AS count
    FROM demo_lifecycle
    WHERE published_at IS NOT NULL
  `) as Array<{ count: number }>;

  const neverViewedRows = (await db`
    SELECT COUNT(*)::int AS count
    FROM demo_lifecycle
    WHERE lifecycle_status = 'published'
      AND view_count = 0
  `) as Array<{ count: number }>;

  const viewedNotPurchasedRows = (await db`
    SELECT COUNT(*)::int AS count
    FROM demo_lifecycle
    WHERE view_count > 0
      AND lifecycle_status IN ('published', 'viewed')
  `) as Array<{ count: number }>;

  const oldestGeneratedRows = (await db`
    SELECT slug, created_at
    FROM demo_lifecycle
    WHERE lifecycle_status = 'generated'
      AND published_at IS NULL
    ORDER BY created_at ASC
    LIMIT 1
  `) as Array<{ slug: string; created_at: Date | string }>;

  const oldestNeverViewedRows = (await db`
    SELECT slug, published_at
    FROM demo_lifecycle
    WHERE lifecycle_status = 'published'
      AND view_count = 0
      AND published_at IS NOT NULL
    ORDER BY published_at ASC
    LIMIT 1
  `) as Array<{ slug: string; published_at: Date | string }>;

  const byStatus: Record<string, number> = {};
  for (const row of statusRows) {
    byStatus[row.lifecycle_status] = row.count;
  }

  const oldestGenerated = oldestGeneratedRows[0];
  const oldestNeverViewed = oldestNeverViewedRows[0];

  return {
    byStatus,
    totalPublished: totalPublishedRows[0]?.count ?? 0,
    publishedNeverViewed: neverViewedRows[0]?.count ?? 0,
    viewedNotPurchased: viewedNotPurchasedRows[0]?.count ?? 0,
    oldestGeneratedUnpublished: oldestGenerated
      ? {
          slug: oldestGenerated.slug,
          createdAt: toIso(oldestGenerated.created_at),
        }
      : null,
    oldestNeverViewed: oldestNeverViewed?.published_at
      ? {
          slug: oldestNeverViewed.slug,
          publishedAt: toIso(oldestNeverViewed.published_at),
        }
      : null,
  };
}
