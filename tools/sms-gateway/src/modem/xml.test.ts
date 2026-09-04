import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildInboundDedupeKey,
  mapSimStatus,
  parseDeviceInfo,
  parseSmsList,
  parseTokenHeader,
  xmlText,
} from "./xml.ts";

describe("xml helpers", () => {
  it("parses tags and empty/malformed input", () => {
    assert.equal(xmlText("<a>hi</a>", "a"), "hi");
    assert.equal(xmlText("", "a"), null);
    assert.equal(xmlText("<notxml", "a"), null);
  });

  it("decodes numeric XML entities in firmware strings", () => {
    assert.equal(
      xmlText("<SoftwareVersion>3.0.3.61&#40;H057SP11C983&#41;</SoftwareVersion>", "SoftwareVersion"),
      "3.0.3.61(H057SP11C983)",
    );
  });

  it("rotates hashed token headers", () => {
    assert.deepEqual(parseTokenHeader("aaa#bbb#ccc"), ["aaa", "bbb", "ccc"]);
    assert.deepEqual(parseTokenHeader(""), []);
    assert.deepEqual(parseTokenHeader(null), []);
  });

  it("maps SIM statuses", () => {
    assert.equal(mapSimStatus("<SimState>0</SimState>"), "NO_SIM");
    assert.equal(mapSimStatus("<response><SimState>1</SimState></response>"), "READY");
    assert.equal(mapSimStatus("<PinState>1</PinState>"), "PIN_REQUIRED");
    assert.equal(mapSimStatus("<PinState>2</PinState>"), "PIN_BLOCKED");
    assert.equal(mapSimStatus("<unknown/>"), "UNKNOWN");
  });

  it("parses device info without exposing IMEI", () => {
    const info = parseDeviceInfo(
      "<response><DeviceName>E3372-325</DeviceName><SoftwareVersion>3.0.3.61</SoftwareVersion><Imei>123</Imei></response>",
    );
    assert.equal(info.model, "E3372-325");
    assert.equal(info.softwareVersion, "3.0.3.61");
    assert.ok(info.deviceNs);
    assert.equal(JSON.stringify(info).includes("123"), false);
  });

  it("parses SMS list with namespaced dedupe keys", () => {
    const xml = `
      <response>
        <Messages>
          <Message>
            <Index>12</Index>
            <Phone>+38640123456</Phone>
            <Content>STOP</Content>
            <Date>2026-09-04 12:00:00</Date>
          </Message>
        </Messages>
      </response>`;
    const messages = parseSmsList(xml, "devns");
    assert.equal(messages.length, 1);
    assert.equal(messages[0]?.modemMessageId, "12");
    assert.equal(messages[0]?.from, "+38640123456");
    assert.ok(messages[0]?.providerMessageId.includes("hilink:devns:12:"));
  });

  it("falls back when index is missing", () => {
    const key = buildInboundDedupeKey({
      deviceNs: "x",
      index: null,
      from: "+38640123456",
      receivedAt: null,
      body: "STOP",
    });
    assert.match(key, /^hilink:x:hash:/);
  });
});
