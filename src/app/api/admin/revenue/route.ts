import { NextResponse } from "next/server";
import { getRevenueAnalytics } from "@/admin/analytics";
import { listRecentAuditLogs } from "@/admin/audit";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const auditLimit = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get("auditLimit")) || 10),
  );

  const [analytics, auditLogs] = await Promise.all([
    getRevenueAnalytics(),
    listRecentAuditLogs(auditLimit),
  ]);

  return NextResponse.json({ analytics, auditLogs });
}
