import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminToken, readBearerToken } from "@/lib/auth";
import { snoozeQueueItem } from "@/admin/queue";
import { afterAdminMutation } from "@/admin/revalidate";
import { logAdminAction } from "@/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z.string().min(1),
  until: z.string().datetime(),
  reason: z.string().optional(),
});

async function isAuthorized(request: Request): Promise<boolean> {
  const bearer = readBearerToken(request.headers.get("authorization"));
  if (isValidAdminToken(bearer)) {
    return true;
  }
  const cookieStore = await cookies();
  return isValidAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await snoozeQueueItem({
    slug: parsed.data.slug,
    until: parsed.data.until,
    reason: parsed.data.reason,
  });
  await afterAdminMutation();
  await logAdminAction({
    action: "queue_snooze",
    slug: parsed.data.slug,
    result: "ok",
    detail: { until: parsed.data.until, reason: parsed.data.reason },
  });

  return NextResponse.json({ ok: true });
}
