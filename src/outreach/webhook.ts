import type { LeadOutreach } from "@/leads/outreach-types";
import { patchLead, readAllLeads } from "@/leads/store";
import { logOutreach } from "./logger";

type WebhookEventType = "email.delivered" | "email.bounced" | "email.complained";

type ResendWebhookPayload = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    bounce?: { message?: string };
    complaint?: { feedback_type?: string };
  };
};

function deliveryStatusForEvent(
  type: WebhookEventType,
): LeadOutreach["deliveryStatus"] | null {
  switch (type) {
    case "email.delivered":
      return "delivered";
    case "email.bounced":
      return "bounced";
    case "email.complained":
      return "complained";
    default:
      return null;
  }
}

function findLeadByMessageId(messageId: string) {
  return (
    readAllLeads().find(
      (lead) =>
        lead.outreach?.messageIds?.includes(messageId) ||
        lead.outreach?.lastMessageId === messageId,
    ) ?? null
  );
}

export function handleResendWebhookEvent(payload: ResendWebhookPayload): {
  handled: boolean;
  slug?: string;
  duplicate?: boolean;
} {
  const type = payload.type as WebhookEventType;
  const messageId = payload.data?.email_id;

  if (!messageId) {
    return { handled: false };
  }

  const deliveryStatus = deliveryStatusForEvent(type);

  if (!deliveryStatus) {
    return { handled: false };
  }

  const lead = findLeadByMessageId(messageId);

  if (!lead) {
    logOutreach({
      level: "warn",
      event: "webhook_unknown_message",
      messageId,
      details: { type },
    });

    return { handled: true };
  }

  const outreach = lead.outreach ?? {};
  const events = outreach.webhookEvents ?? [];
  const eventKey = `${type}:${messageId}`;

  if (events.some((event) => `${event.type}:${event.messageId}` === eventKey)) {
    return { handled: true, slug: lead.slug, duplicate: true };
  }

  const receivedAt = payload.created_at ?? new Date().toISOString();
  const bounceMessage =
    type === "email.bounced" ? payload.data?.bounce?.message : undefined;

  patchLead(lead.slug, {
    outreach: {
      ...outreach,
      deliveryStatus,
      lastError: bounceMessage ?? outreach.lastError,
      webhookEvents: [
        ...events,
        {
          type,
          messageId,
          receivedAt,
        },
      ],
    },
  });

  logOutreach({
    level: "info",
    event: "webhook_processed",
    slug: lead.slug,
    messageId,
    details: { type, deliveryStatus },
  });

  return { handled: true, slug: lead.slug };
}
