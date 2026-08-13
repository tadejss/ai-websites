import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { getOutreachConfig } from "@/outreach/config";
import { handleResendWebhookEvent } from "@/outreach/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = getOutreachConfig();
  const payload = await request.text();

  if (config.webhookSecret) {
    const headers = {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    };

    try {
      const webhook = new Webhook(config.webhookSecret);
      webhook.verify(payload, headers);
    } catch {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }
  }

  let event: unknown;

  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const result = handleResendWebhookEvent(
    event as Parameters<typeof handleResendWebhookEvent>[0],
  );

  return NextResponse.json({ ok: true, ...result });
}
