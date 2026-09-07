import { getSmsConfig } from "./config";
import { claimQueuedMessageById, claimQueuedMessages } from "./store";
import type { ClaimedSms } from "./types";

export async function claimSmsBatch(input?: {
  limit?: number;
  claimedBy?: string;
}): Promise<ClaimedSms[]> {
  const config = getSmsConfig();
  const limit = Math.min(input?.limit ?? config.batchSize, config.batchSize);
  const claimedBy = input?.claimedBy ?? "gateway";

  const rows = await claimQueuedMessages({
    limit,
    claimedBy,
    leaseMinutes: config.claimLeaseMinutes,
  });

  return rows.map((row) => ({
    messageId: row.messageId,
    to: row.toPhone,
    text: row.body,
  }));
}

/** Isolated claim: only the given messageId, never FIFO siblings. */
export async function claimSmsByMessageId(input: {
  messageId: string;
  claimedBy?: string;
}): Promise<ClaimedSms | null> {
  const config = getSmsConfig();
  const row = await claimQueuedMessageById({
    messageId: input.messageId,
    claimedBy: input.claimedBy ?? "one-shot",
    leaseMinutes: config.claimLeaseMinutes,
  });
  if (!row) {
    return null;
  }
  return {
    messageId: row.messageId,
    to: row.toPhone,
    text: row.body,
  };
}
