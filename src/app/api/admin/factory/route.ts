import { NextResponse } from "next/server";
import { getFactoryOpsSnapshot } from "@/factory/ops-snapshot";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getFactoryOpsSnapshot();
  return NextResponse.json(snapshot);
}
