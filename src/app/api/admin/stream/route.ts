import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminToken, readBearerToken } from "@/lib/auth";
import { getAdminHealthPayload } from "@/admin/health";
import { getQueueCounts } from "@/admin/queue";
import { getFactoryOpsSnapshot } from "@/factory/ops-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAuthorized(request: Request): Promise<boolean> {
  const bearer = readBearerToken(request.headers.get("authorization"));
  if (isValidAdminToken(bearer)) {
    return true;
  }
  const cookieStore = await cookies();
  return isValidAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      async function push() {
        if (closed) return;
        try {
          const [health, queueCounts, snapshot] = await Promise.all([
            getAdminHealthPayload(),
            getQueueCounts(),
            getFactoryOpsSnapshot(),
          ]);
          const payload = {
            type: "health_update",
            health,
            queueCounts,
            critical:
              queueCounts.publish_failed > 0 ||
              snapshot.worker.circuitOpen === true,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        } catch {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error" })}\n\n`),
          );
        }
      }

      await push();
      const interval = setInterval(() => void push(), 5000);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
