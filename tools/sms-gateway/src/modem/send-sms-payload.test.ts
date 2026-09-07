import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeSmsLength } from "../../../../src/outreach/sms/templates.ts";
import { hilinkReservedForText, isGsm7Text } from "../../../../src/outreach/sms/gsm7.ts";
import {
  buildHiLinkSendSmsPayload,
  escapeXml,
} from "./send-sms-payload.ts";

describe("HiLink send-sms Reserved encoding", () => {
  const fixedDate = new Date("2026-09-07T10:00:00");

  it("ASCII-only message → Reserved=1 (GSM-7)", () => {
    const text = "Hello! Free website demo: zbrendiraj.si/test";
    const payload = buildHiLinkSendSmsPayload("+38640123456", text, fixedDate);
    assert.equal(payload.reserved, 1);
    assert.equal(payload.encoding, "gsm7");
    assert.match(payload.body, /<Reserved>1<\/Reserved>/);
    assert.equal(hilinkReservedForText(text), 1);
    assert.equal(isGsm7Text(text), true);
    assert.equal(analyzeSmsLength(text).encoding, "gsm7");
  });

  it("production initial/manual ASCII copy → Reserved=1 (GSM-7)", () => {
    const text =
      "Zdravo! Za Studio Test sem pripravil zastonj predlog spletne strani: zbrendiraj.si/studio-test\n" +
      "Bi vas zanimalo, da jo uredimo? Tadej, Zbrendiraj.si\n" +
      "Ali pa samo odgovorite z NE.";
    const analyzed = analyzeSmsLength(text);
    const payload = buildHiLinkSendSmsPayload("+38640853344", text, fixedDate);
    assert.equal(isGsm7Text(text), true);
    assert.equal(analyzed.encoding, "gsm7");
    assert.equal(payload.reserved, 1);
    assert.equal(payload.encoding, "gsm7");
    assert.match(payload.body, /<Reserved>1<\/Reserved>/);
    assert.equal(/[ščžŠČŽ]/.test(text), false);
  });

  it("message containing š → Reserved=0 (UCS2)", () => {
    const text = "napisite -> napišite";
    const payload = buildHiLinkSendSmsPayload("+38640123456", text, fixedDate);
    assert.equal(payload.reserved, 0);
    assert.equal(payload.encoding, "ucs2");
    assert.match(payload.body, /<Reserved>0<\/Reserved>/);
    assert.equal(analyzeSmsLength(text).encoding, "ucs2");
  });

  it("message containing č → Reserved=0 (UCS2)", () => {
    const text = "brezplacen -> brezplačen";
    const payload = buildHiLinkSendSmsPayload("+38640123456", text, fixedDate);
    assert.equal(payload.reserved, 0);
    assert.match(payload.body, /<Reserved>0<\/Reserved>/);
  });

  it("message containing ž → Reserved=0 (UCS2)", () => {
    const text = "Zivjo -> Živjo";
    const payload = buildHiLinkSendSmsPayload("+38640123456", text, fixedDate);
    assert.equal(payload.reserved, 0);
    assert.match(payload.body, /<Reserved>0<\/Reserved>/);
  });

  it("multipart Unicode message → Reserved=0 and agrees with analyzeSmsLength", () => {
    const text =
      "Živjo! Za 3ici install, vodovodne inštalacije sem pripravil brezplačen predlog spletne strani: zbrendiraj.si/3ici-install-vodovodne\n" +
      "Bi vas zanimalo, da jo uredimo? Če ne, samo napišite NE. Tadej, Zbrendiraj.si";
    const analyzed = analyzeSmsLength(text);
    const payload = buildHiLinkSendSmsPayload("+38640853344", text, fixedDate);
    assert.equal(analyzed.encoding, "ucs2");
    assert.ok(analyzed.segments >= 2, "multipart UCS2");
    assert.equal(payload.reserved, 0);
    assert.equal(payload.encoding, analyzed.encoding);
    assert.equal(payload.length, analyzed.length);
    assert.match(payload.body, /<Reserved>0<\/Reserved>/);
    assert.match(payload.body, /<Content>[\s\S]*Živjo[\s\S]*<\/Content>/);
    // Content must stay plain text, not hex
    const content = payload.body.match(/<Content>([\s\S]*?)<\/Content>/)?.[1] ?? "";
    assert.equal(/^[0-9A-Fa-f]+$/.test(content), false);
    assert.match(content, /[ščžŠČŽ]/u);
  });

  it("XML escaping still works for <>& in Content and Phone", () => {
    const text = "A <B> & C";
    const payload = buildHiLinkSendSmsPayload("+38640<script>", text, fixedDate);
    assert.match(payload.body, /<Content>A &lt;B&gt; &amp; C<\/Content>/);
    assert.match(payload.body, /<Phone>\+38640&lt;script&gt;<\/Phone>/);
    assert.equal(escapeXml("a&b"), "a&amp;b");
  });
});
