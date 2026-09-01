import { NextResponse } from "next/server";
import { logAdminAction } from "@/admin/audit";
import { getFactoryWorkerConfig } from "@/factory/config";
import {
  releaseStaleFailedGenerationLocks,
} from "@/factory/generation-lock";
import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureFactorySchema } from "@/db/ensure-schema";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  await ensureFactorySchema();
  const config = getFactoryWorkerConfig();
  const staleMinutes = config.leaseMinutes * 2;
  const db = sql();

  const rows = (await db`
    DELETE FROM factory_generation_locks
    WHERE status = 'generating'
      AND updated_at < NOW() - (${staleMinutes}::text || ' minutes')::interval
    RETURNING slug
  `) as Array<{ slug: string }>;

  const staleFailedReleased = await releaseStaleFailedGenerationLocks(
    config.generationRetryMinutes,
  );

  await logAdminAction({
    action: "factory_cleanup_locks",
    result: "ok",
    detail: {
      removed: rows.length,
      staleFailedRemoved: staleFailedReleased.length,
      staleMinutes,
    },
  });

  return NextResponse.json({
    ok: true,
    removed: rows.length,
    staleFailedRemoved: staleFailedReleased.length,
    slugs: rows.map((r) => r.slug),
    staleFailedSlugs: staleFailedReleased,
  });
}
