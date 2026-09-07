import { getSmsConfig } from "./config";
import { claimQueuedMessageById, claimQueuedMessages } from "./store";
import { getDailySmsCapacity } from "./daily-budget";
import { isSmsSendWindowOpen } from "./timezone";
import type { ClaimedSms } from "./types";

export async function claimSmsBatch(input?: {
  limit?: number;
  claimedBy?: string;
}): Promise<ClaimedSms[]> {
  const config = getSmsConfig();
  // LIVE outbound: exactly one claim at a time.
  const limit = 1;
  void input?.limit;
  void config.batchSize;

  if (!isSmsSendWindowOpen()) {
    return [];
  }

  const capacity = await getDailySmsCapacity({ source: "claim_batch" });
  // Send gate: drain queued messages until today's sent count hits target.
  // Do NOT use enqueueRemaining — that only limits NEW inserts.
  if (capacity.sendRemaining <= 0 || capacity.sent >= capacity.target) {
    return [];
  }

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
