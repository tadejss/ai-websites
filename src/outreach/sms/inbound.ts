import {
  cancelQueuedAndClaimedForPhone,
  findSlugsByNormalizedPhone,
  getSmsLeadState,
  insertInbound,
  upsertSmsLeadState,
  upsertSmsOptOut,
} from "./store";
import { parseSmsOptOut } from "./opt-out";
import { normalizeSlovenianPhone } from "./phone";
import type { SmsInboundRecord } from "./types";

export type InboundSmsInput = {
  providerMessageId?: string | null;
  from: string;
  to?: string | null;
  body: string;
  receivedAt?: string | null;
};

export type ProcessInboundSmsResult = SmsInboundRecord & {
  keyword?: string;
  cancelledCount: number;
};

export async function processInboundSms(
  input: InboundSmsInput,
): Promise<ProcessInboundSmsResult> {
  const parsed = parseSmsOptOut(input.body);
  const from = normalizeSlovenianPhone(input.from);
  const fromPhone = from.ok ? from.e164 : input.from.trim();
  const slugs = from.ok ? await findSlugsByNormalizedPhone(from.e164) : [];
  const slug = slugs[0] ?? null;

  const record = await insertInbound({
    providerMessageId: input.providerMessageId ?? null,
    fromPhone,
    toPhone: input.to ?? null,
    body: input.body,
    receivedAt: input.receivedAt ?? null,
    slug,
    matched: slugs.length > 0,
    isOptOut: parsed.optedOut,
    normalizationFailed: !from.ok,
  });

  let cancelledCount = 0;

  if (parsed.optedOut && from.ok) {
    const reason = (parsed.keyword ?? "STOP").toLowerCase();
    await upsertSmsOptOut({
      phone: from.e164,
      source: "inbound_sms",
      reason,
    });
    cancelledCount = await cancelQueuedAndClaimedForPhone(from.e164);

    for (const matchedSlug of slugs) {
      await upsertSmsLeadState({
        slug: matchedSlug,
        normalizedPhone: from.e164,
        smsStatus: "opted_out",
        smsAllowed: false,
        smsReplyAt: record.receivedAt,
      });
    }
  } else if (slug) {
    const existing = await getSmsLeadState(slug);
    const alreadyOptedOut =
      existing?.smsStatus === "opted_out" || existing?.smsAllowed === false;

    await upsertSmsLeadState({
      slug,
      normalizedPhone: from.ok ? from.e164 : undefined,
      smsStatus: alreadyOptedOut ? "opted_out" : "replied",
      smsAllowed: alreadyOptedOut ? false : undefined,
      smsReplyAt: record.receivedAt,
    });
  }

  return {
    ...record,
    keyword: parsed.keyword,
    cancelledCount,
  };
}
