import { applyMessageResult, getSmsMessageById, upsertSmsLeadState } from "./store";
import type { SmsMessageRecord } from "./types";

export type SmsResultInput = {
  messageId: string;
  success: boolean;
  providerMessageId?: string | null;
  error?: string | null;
};

export type ApplySmsResultOutcome = {
  message: SmsMessageRecord;
  alreadyApplied: boolean;
};

export async function applySmsResult(
  input: SmsResultInput,
): Promise<ApplySmsResultOutcome | null> {
  const existing = await getSmsMessageById(input.messageId);
  if (!existing) {
    return null;
  }

  if (existing.status === "sent" || existing.status === "cancelled") {
    return { message: existing, alreadyApplied: true };
  }

  if (existing.status === "failed" && !input.success) {
    return { message: existing, alreadyApplied: true };
  }

  const updated = await applyMessageResult({
    messageId: input.messageId,
    success: input.success,
    providerMessageId: input.providerMessageId,
    error: input.error,
  });

  if (!updated) {
    const refreshed = await getSmsMessageById(input.messageId);
    return refreshed ? { message: refreshed, alreadyApplied: true } : null;
  }

  await upsertSmsLeadState({
    slug: updated.slug,
    smsStatus: input.success ? "sent" : "failed",
    smsSentAt: input.success ? updated.sentAt : undefined,
    smsLastError: input.success ? null : (input.error ?? "Send failed"),
    smsMessageId: updated.messageId,
  });

  return { message: updated, alreadyApplied: false };
}
