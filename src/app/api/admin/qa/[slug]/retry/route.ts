import { logAdminAction } from "@/admin/audit";
import { afterAdminMutation } from "@/admin/revalidate";
import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { clientSiteExists } from "@/leads/client-exists";
import { enqueueQaRun } from "@/qa/enqueue";
import { processQaRun } from "@/qa/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  if (!clientSiteExists(slug)) {
    return NextResponse.json({ error: "Demo site not found" }, { status: 404 });
  }

  const enqueued = await enqueueQaRun({
    slug,
    trigger: "admin",
    force: true,
  });

  if (enqueued.outcome !== "enqueued") {
    return NextResponse.json(
      { error: enqueued.reason, outcome: enqueued.outcome },
      { status: 409 },
    );
  }

  const outcome = await processQaRun(enqueued.run, `admin-${slug}`);

  await logAdminAction({
    action: "qa_run",
    slug,
    result: "ok",
    detail: { runId: enqueued.run.id, outcome },
  });
  await afterAdminMutation();

  return NextResponse.json({
    ok: true,
    runId: enqueued.run.id,
    outcome,
  });
}
