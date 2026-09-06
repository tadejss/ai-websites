import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { listRecentAuditLogs } from "@/admin/audit";
import { listSystemEvents } from "@/admin/system-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));

  const [audit, system] = await Promise.all([
    listRecentAuditLogs(limit),
    listSystemEvents(limit),
  ]);

  return NextResponse.json({ audit, system });
}
