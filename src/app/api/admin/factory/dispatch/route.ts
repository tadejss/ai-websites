import { NextResponse } from "next/server";
import { logAdminAction } from "@/admin/audit";
import { dispatchFactoryWorker } from "@/factory/dispatch";
import { getReplenishStatus } from "@/leads/replenish-status";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const replenish = await getReplenishStatus();
  const result = await dispatchFactoryWorker({
    reason: "admin_manual_dispatch",
    actionable: replenish.actionable,
    needed: replenish.needed,
    target: replenish.target,
  });

  await logAdminAction({
    action: "factory_dispatch",
    result: result.ok && ("dispatched" in result && result.dispatched) ? "ok" : "error",
    detail: result as Record<string, unknown>,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result);
}
