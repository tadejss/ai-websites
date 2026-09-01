import { NextResponse } from "next/server";
import { refreshAdminEntityIndex } from "@/admin/entity-index";
import { afterAdminMutation } from "@/admin/revalidate";
import { logSystemEvent } from "@/admin/system-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await refreshAdminEntityIndex();
  await afterAdminMutation();
  await logSystemEvent({
    kind: "index_refresh",
    message: `Refreshed admin entity index (${count} rows)`,
    detail: { count },
  });

  return NextResponse.json({ ok: true, count });
}
