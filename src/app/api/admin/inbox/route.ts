import { NextResponse } from "next/server";
import { getAdminInboxData } from "@/admin/inbox";
import { getFactoryOpsSnapshot } from "@/factory/ops-snapshot";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [inbox, snapshot] = await Promise.all([
    getAdminInboxData(),
    getFactoryOpsSnapshot(),
  ]);

  return NextResponse.json({
    ...inbox,
    replenish: {
      needed: snapshot.replenish.needed,
      actionable: snapshot.replenish.actionable,
      target: snapshot.replenish.target,
    },
  });
}
