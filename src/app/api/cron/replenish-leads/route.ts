import { NextResponse } from "next/server";
import { isValidCronToken, readBearerToken } from "@/lib/auth";
import { dispatchFactoryWorker } from "@/factory/dispatch";
import { getFactoryWorkerConfig } from "@/factory/config";
import { getReplenishStatus } from "@/leads/replenish-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron: report demo backlog and optionally dispatch the GitHub Actions
 * factory worker when replenishment is needed.
 *
 * Does NOT generate demos on Vercel (filesystem is ephemeral).
 */
export async function GET(request: Request) {
  const token = readBearerToken(request.headers.get("authorization"));
  if (!isValidCronToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getReplenishStatus();
    const config = getFactoryWorkerConfig();

    console.log(
      `[cron/replenish-leads] actionable=${status.actionable} target=${status.target} needed=${status.needed}`,
    );

    if (status.needed <= 0) {
      return NextResponse.json({
        ok: true,
        mode: "status_only",
        ...status,
        dispatched: false,
        message: "Backlog at or above target.",
      });
    }

    if (!config.dispatchEnabled) {
      return NextResponse.json({
        ok: true,
        mode: "status_only",
        ...status,
        dispatched: false,
        message:
          "Backlog below target. Enable FACTORY_DISPATCH_ENABLED + GitHub token to auto-dispatch, or run: npm run factory-worker",
      });
    }

    const dispatch = await dispatchFactoryWorker({
      reason: "cron_backlog_below_target",
      actionable: status.actionable,
      needed: status.needed,
      target: status.target,
    });

    if (!dispatch.ok) {
      console.error("[cron/replenish-leads] dispatch error:", dispatch.error);
      return NextResponse.json(
        {
          ok: false,
          mode: "dispatch_failed",
          ...status,
          error: dispatch.error,
        },
        { status: 500 },
      );
    }

    console.log(
      `[cron/replenish-leads] dispatched=${dispatch.dispatched}`,
      dispatch.dispatched ? "" : dispatch.reason,
    );

    return NextResponse.json({
      ok: true,
      mode: dispatch.dispatched ? "dispatched" : "status_only",
      ...status,
      dispatched: dispatch.dispatched,
      dispatchReason: dispatch.dispatched ? undefined : dispatch.reason,
      message: dispatch.dispatched
        ? "Factory worker workflow dispatched via GitHub repository_dispatch."
        : dispatch.reason,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cron/replenish-leads]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
