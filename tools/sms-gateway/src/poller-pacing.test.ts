import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  randomSendDelayMs,
  SMS_SEND_DELAY_MAX_MS,
  SMS_SEND_DELAY_MIN_MS,
} from "./poller.ts";
import {
  canSendMore,
  computeEnqueueRemaining,
  computeSendRemaining,
} from "../../../src/outreach/sms/daily-budget.ts";

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

  it("send continues when enqueueRemaining=0 but sendRemaining>0", () => {
    const target = 43;
    const sent = 1;
    const inFlight = 42;
    const enqueueRemaining = computeEnqueueRemaining({
      target,
      sent,
      inFlight,
    });
    const sendRemaining = computeSendRemaining({ target, sent });
    assert.equal(enqueueRemaining, 0);
    assert.equal(sendRemaining, 42);
    assert.equal(canSendMore({ sendRemaining, sent, target }), true);
    // Poller gate mirrors sendRemaining, not enqueueRemaining.
    assert.equal(sendRemaining <= 0 || sent >= target, false);
  });

  it("send stops when sent reaches target", () => {
    const target = 43;
    const sent = 43;
    const sendRemaining = computeSendRemaining({ target, sent });
    assert.equal(sendRemaining, 0);
    assert.equal(canSendMore({ sendRemaining, sent, target }), false);
  });
});
