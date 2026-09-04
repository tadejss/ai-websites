import { getSmsConfig } from "./config";
import { claimQueuedMessages } from "./store";
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
