import { findSlugByNormalizedPhone, getSmsLeadState, insertInbound, upsertSmsLeadState } from "./store";
import { isOptOutMessage } from "./opt-out";
import { normalizeSlovenianPhone } from "./phone";
import type { SmsInboundRecord } from "./types";

export type InboundSmsInput = {
  providerMessageId?: string | null;
  from: string;
  to?: string | null;
  body: string;
  receivedAt?: string | null;
};

export async function processInboundSms(
  input: InboundSmsInput,
): Promise<SmsInboundRecord> {
  const from = normalizeSlovenianPhone(input.from);
  const fromPhone = from.ok ? from.e164 : input.from.trim();
  const slug = from.ok ? await findSlugByNormalizedPhone(from.e164) : null;
  const optOut = isOptOutMessage(input.body);

  const record = await insertInbound({
    providerMessageId: input.providerMessageId ?? null,
    fromPhone,
    toPhone: input.to ?? null,
    body: input.body,
    receivedAt: input.receivedAt ?? null,
    slug,
    matched: Boolean(slug),
    isOptOut: optOut,
  });

  if (slug) {
    const existing = await getSmsLeadState(slug);
    const alreadyOptedOut =
      existing?.smsStatus === "opted_out" || existing?.smsAllowed === false;

    await upsertSmsLeadState({
      slug,
      normalizedPhone: from.ok ? from.e164 : undefined,
      // Never downgrade opted_out → replied on a later non-STOP message.
      smsStatus: optOut || alreadyOptedOut ? "opted_out" : "replied",
      smsAllowed: optOut || alreadyOptedOut ? false : undefined,
      smsReplyAt: record.receivedAt,
    });
  }

  return record;
}
