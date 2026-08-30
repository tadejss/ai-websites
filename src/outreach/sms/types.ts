export const GSM7_SINGLE_SEGMENT = 160;
export const GSM7_CONCAT_SEGMENT = 153;
export const UCS2_SINGLE_SEGMENT = 70;

export type SmsStep = "initial" | "followup_1" | "followup_2" | "manual";

export const SMS_LEAD_STATUSES = [
  "pending",
  "queued",
  "sending",
  "sent",
  "failed",
  "replied",
  "opted_out",
] as const;

export type SmsLeadStatus = (typeof SMS_LEAD_STATUSES)[number];

export const SMS_MESSAGE_STATUSES = [
  "queued",
  "claimed",
  "sending",
  "sent",
  "failed",
  "cancelled",
] as const;

export type SmsMessageStatus = (typeof SMS_MESSAGE_STATUSES)[number];

export type SmsMessageRecord = {
  id: number;
  messageId: string;
  slug: string;
  toPhone: string;
  toPhoneRaw: string | null;
  body: string;
  status: SmsMessageStatus;
  step: SmsStep;
  providerMessageId: string | null;
  lastError: string | null;
  claimedAt: string | null;
  claimedBy: string | null;
  claimExpiresAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SmsLeadState = {
  slug: string;
  normalizedPhone: string | null;
  smsStatus: SmsLeadStatus;
  smsAllowed: boolean;
  smsSentAt: string | null;
  smsLastError: string | null;
  smsMessageId: string | null;
  smsReplyAt: string | null;
  updatedAt: string;
};

export type SmsInboundRecord = {
  id: number;
  providerMessageId: string | null;
  fromPhone: string;
  toPhone: string | null;
  body: string;
  receivedAt: string;
  slug: string | null;
  matched: boolean;
  isOptOut: boolean;
  createdAt: string;
};

export type ClaimedSms = {
  messageId: string;
  to: string;
  text: string;
};
