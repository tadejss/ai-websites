import { hilinkReservedForText } from "../../../../src/outreach/sms/gsm7.ts";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatHiLinkDate(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export type HilinkSendSmsPayload = {
  body: string;
  reserved: 0 | 1;
  encoding: "gsm7" | "ucs2";
  length: number;
  content: string;
  to: string;
};

/**
 * Build the HiLink /api/sms/send-sms XML body.
 * Reserved: 1 = GSM-7, 0 = UCS2 (Salamek TextModeEnum).
 * Content stays plain text (XML-escaped), never UTF-16BE hex.
 */
export function buildHiLinkSendSmsPayload(
  to: string,
  message: string,
  date = new Date(),
): HilinkSendSmsPayload {
  const reserved = hilinkReservedForText(message);
  const encoding = reserved === 1 ? "gsm7" : "ucs2";
  const content = escapeXml(message);
  const body =
    `<?xml version='1.0' encoding='UTF-8'?>` +
    `<request>` +
    `<Index>-1</Index>` +
    `<Phones><Phone>${escapeXml(to)}</Phone></Phones>` +
    `<Sca></Sca>` +
    `<Content>${content}</Content>` +
    `<Length>${message.length}</Length>` +
    `<Reserved>${reserved}</Reserved>` +
    `<Date>${formatHiLinkDate(date)}</Date>` +
    `</request>`;

  return {
    body,
    reserved,
    encoding,
    length: message.length,
    content,
    to,
  };
}

export { escapeXml };
