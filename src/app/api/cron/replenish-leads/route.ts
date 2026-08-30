import { NextResponse } from "next/server";
import { isValidCronToken, readBearerToken } from "@/lib/auth";
import { getReplenishStatus } from "@/leads/replenish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Status-only cron: reports actionable vs target.
 * Does not discover places or generate demos (filesystem is ephemeral on Vercel).
 */
export async function GET(request: Request) {
  const token = readBearerToken(request.headers.get("authorization"));
  if (!isValidCronToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getReplenishStatus();
    console.log(
      `[cron/replenish-leads] actionable=${status.actionable} target=${status.target} needed=${status.needed}`,
    );
    return NextResponse.json({
      ok: true,
      mode: "status_only",
      ...status,
      message:
        status.needed > 0
          ? `Run locally: npm run replenish-leads (then commit manually).`
          : "Backlog at or above target.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cron/replenish-leads]", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
