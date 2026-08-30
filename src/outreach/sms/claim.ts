import { getSmsConfig } from "./config";
import { claimQueuedMessages, markMessageSending } from "./store";
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

  const claimed: ClaimedSms[] = [];
  for (const row of rows) {
    await markMessageSending(row.messageId);
    claimed.push({
      messageId: row.messageId,
      to: row.toPhone,
      text: row.body,
    });
  }

  return claimed;
}
