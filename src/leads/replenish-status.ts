import {
  getSmsConfig,
  smsLeadReplenishmentNeeded,
} from "@/outreach/sms/config";
import { countActionableSmsLeads } from "@/outreach/sms/relevance";

/** Status-only snapshot for Vercel cron / admin (no Places, no generation). */
export async function getReplenishStatus(): Promise<{
  actionable: number;
  target: number;
  needed: number;
  batch: number;
}> {
  const config = getSmsConfig();
  const actionable = await countActionableSmsLeads();
  return {
    actionable,
    target: config.leadTarget,
    needed: smsLeadReplenishmentNeeded(actionable, config.leadTarget),
    batch: config.leadReplenishBatch,
  };
}
