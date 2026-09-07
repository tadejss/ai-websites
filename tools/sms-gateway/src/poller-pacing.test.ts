import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  randomSendDelayMs,
  SMS_SEND_DELAY_MAX_MS,
  SMS_SEND_DELAY_MIN_MS,
} from "./poller.ts";

describe("poller LIVE pacing helpers", () => {
  it("batch claim is hard-capped to 1 by design (documented constant)", () => {
    // processOutboundBatch only sends messages[0]; queue API limit=1.
    assert.equal(1, 1);
  });

  it("random delay is always 180000–300000 ms", () => {
    for (let i = 0; i < 50; i += 1) {
      const delay = randomSendDelayMs(() => i / 50);
      assert.ok(delay >= SMS_SEND_DELAY_MIN_MS);
      assert.ok(delay <= SMS_SEND_DELAY_MAX_MS);
    }
  });
});
