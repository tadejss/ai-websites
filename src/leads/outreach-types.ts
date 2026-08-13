export type OutreachStep = "initial" | "followup_1" | "followup_2";

export type OutreachDeliveryStatus =
  | "sent"
  | "delivered"
  | "bounced"
  | "complained";

export type ContactHistoryEntry = {
  step: OutreachStep | "manual";
  sentAt: string;
  messageId?: string;
  subject: string;
  dryRun?: boolean;
};

export type LeadOutreach = {
  initialSentAt?: string;
  followup1SentAt?: string;
  followup2SentAt?: string;
  lastSentAt?: string;
  nextFollowUpAt?: string;
  emailsSent?: number;
  lastMessageId?: string;
  messageIds?: string[];
  lastError?: string;
  deliveryStatus?: OutreachDeliveryStatus;
  /** Reserved for future reply detection – never set automatically today. */
  repliedAt?: string;
  webhookEvents?: Array<{
    type: string;
    messageId: string;
    receivedAt: string;
  }>;
};
