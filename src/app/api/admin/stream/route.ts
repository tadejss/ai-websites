import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getAdminHealthSummary } from "@/admin/health";
import { getQueueCounts } from "@/admin/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STREAM_INTERVAL_MS = 30_000;

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      async function push() {
        if (closed) return;
        try {
          const [health, queueCounts] = await Promise.all([
            getAdminHealthSummary(),
            getQueueCounts(),
          ]);
          const payload = {
            type: "health_update",
            health,
            queueCounts,
            critical:
              queueCounts.publish_failed > 0 || health.circuitOpen === true,
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
      const interval = setInterval(() => void push(), STREAM_INTERVAL_MS);

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
