import { NextResponse } from "next/server";
import { refreshAdminEntityIndex } from "@/admin/entity-index";
import { afterAdminMutation } from "@/admin/revalidate";
import { logSystemEvent } from "@/admin/system-events";
import {
  backfillPublishedFromFactoryLocks,
  purgeExpiredDemoViewDedupe,
} from "@/demo-lifecycle/store";
import { releaseStaleFailedGenerationLocks } from "@/factory/generation-lock";
import { isValidCronToken, readBearerToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = readBearerToken(request.headers.get("authorization"));
  if (!isValidCronToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [backfilled, staleFailedReleased, purgedDedupe] = await Promise.all([
    backfillPublishedFromFactoryLocks(),
    releaseStaleFailedGenerationLocks(),
    purgeExpiredDemoViewDedupe(),
  ]);

  const count = await refreshAdminEntityIndex();
  await afterAdminMutation();
  await logSystemEvent({
    kind: "index_refresh",
    message: `Refreshed admin entity index (${count} rows)`,
    detail: {
      count,
      backfilled,
      staleFailedReleased: staleFailedReleased.length,
      purgedDedupe,
    },
  });

  return NextResponse.json({
    ok: true,
    count,
    backfilled,
    staleFailedReleased: staleFailedReleased.length,
    purgedDedupe,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
