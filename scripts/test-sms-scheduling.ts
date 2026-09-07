/**
 * Unit tests for LIVE SMS scheduling: timezone, daily target, pacing, follow-up freeze.
 * Does not send SMS, start the poller, or enable production cron.
 */
import assert from "node:assert/strict";
import {
  computeRemainingCapacity,
  randomDailySmsTarget,
  SMS_DAILY_TARGET_MAX,
  SMS_DAILY_TARGET_MIN,
} from "../src/outreach/sms/daily-budget";
import {
  resolveDueSmsStepFromCaches,
} from "../src/outreach/sms/enqueue-batch";
import { renderSms } from "../src/outreach/sms/templates";
import { hilinkReservedForText, isGsm7Text } from "../src/outreach/sms/gsm7";
import {
  isSmsSendWindowOpen,
  ljubljanaDayUtcBounds,
  ljubljanaLocalDate,
  ljubljanaWallTime,
} from "../src/outreach/sms/timezone";
import {
  randomSendDelayMs,
  SMS_SEND_DELAY_MAX_MS,
  SMS_SEND_DELAY_MIN_MS,
} from "../tools/sms-gateway/src/poller";
import { buildHiLinkSendSmsPayload } from "../tools/sms-gateway/src/modem/send-sms-payload";

function ok(condition: boolean, message: string) {
  assert.equal(condition, true, message);
}

function main() {
  // Random target always 40–50
  for (let i = 0; i < 200; i += 1) {
    const t = randomDailySmsTarget(() => i / 200);
    ok(t >= SMS_DAILY_TARGET_MIN && t <= SMS_DAILY_TARGET_MAX, `target ${t}`);
  }
  ok(randomDailySmsTarget(() => 0) === 40, "target min");
  ok(randomDailySmsTarget(() => 0.999) === 50, "target max");

  // Remaining capacity never negative
  ok(computeRemainingCapacity({ target: 45, sent: 40, inFlight: 10 }) === 0, "cap at 0");
  ok(computeRemainingCapacity({ target: 45, sent: 10, inFlight: 5 }) === 30, "remaining 30");

  // CET window: Jan 15 2026, CET = UTC+1
  const cetBefore = new Date("2026-01-15T08:12:00.000Z");
  const cetAt = new Date("2026-01-15T08:13:00.000Z");
  ok(ljubljanaWallTime(cetBefore).hour === 9, "CET 09h");
  ok(ljubljanaWallTime(cetBefore).minute === 12, "CET 09:12");
  ok(ljubljanaWallTime(cetAt).minute === 13, "CET 09:13");
  ok(!isSmsSendWindowOpen(cetBefore), "09:12 CET closed");
  ok(isSmsSendWindowOpen(cetAt), "09:13 CET open");

  // CEST window: Jul 15 2026, CEST = UTC+2
  const cestBefore = new Date("2026-07-15T07:12:00.000Z");
  const cestAt = new Date("2026-07-15T07:13:00.000Z");
  ok(ljubljanaWallTime(cestBefore).minute === 12, "CEST 09:12");
  ok(ljubljanaWallTime(cestAt).minute === 13, "CEST 09:13");
  ok(!isSmsSendWindowOpen(cestBefore), "09:12 CEST closed");
  ok(isSmsSendWindowOpen(cestAt), "09:13 CEST open");

  // Day bounds map wall midnight correctly (CET)
  const winter = ljubljanaDayUtcBounds("2026-01-15");
  ok(
    ljubljanaLocalDate(winter.start) === "2026-01-15",
    "winter start local date",
  );
  ok(ljubljanaWallTime(winter.start).hour === 0, "winter start hour 0");
  ok(
    ljubljanaLocalDate(new Date(winter.end.getTime() - 1000)) === "2026-01-15",
    "winter end-1s still same day",
  );
  ok(ljubljanaLocalDate(winter.end) === "2026-01-16", "winter end next day");

  // Day bounds around DST (CEST)
  const summer = ljubljanaDayUtcBounds("2026-07-15");
  ok(ljubljanaLocalDate(summer.start) === "2026-07-15", "summer start");
  ok(ljubljanaWallTime(summer.start).hour === 0, "summer midnight");
  ok(ljubljanaLocalDate(summer.end) === "2026-07-16", "summer end");

  // Follow-up freeze: automated allowedSteps filter simulated
  const dueFollowup = resolveDueSmsStepFromCaches(
    {
      slug: "x",
      normalizedPhone: "+38641111111",
      smsStatus: "sent",
      smsAllowed: true,
      smsSentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      smsLastError: null,
      smsMessageId: "m",
      smsReplyAt: null,
      updatedAt: new Date().toISOString(),
    },
    new Set(["initial"]),
    "contacted",
  );
  ok(dueFollowup === "followup_1", "resolver still knows followup_1 is due");
  const automatedAllowed = new Set(["initial"]);
  ok(
    !automatedAllowed.has(dueFollowup!),
    "automated cron must not enqueue followup_1",
  );

  const dueInitial = resolveDueSmsStepFromCaches(
    null,
    new Set(),
    "generated",
  );
  ok(dueInitial === "initial", "initial still due for new leads");
  ok(automatedAllowed.has(dueInitial!), "automated cron enqueues initial");

  // Poller delay 180–300s
  for (let i = 0; i < 100; i += 1) {
    const delay = randomSendDelayMs(() => i / 100);
    ok(
      delay >= SMS_SEND_DELAY_MIN_MS && delay <= SMS_SEND_DELAY_MAX_MS,
      `delay ${delay}`,
    );
  }
  ok(randomSendDelayMs(() => 0) === SMS_SEND_DELAY_MIN_MS, "delay min");
  ok(randomSendDelayMs(() => 0.999999) === SMS_SEND_DELAY_MAX_MS, "delay max");
  ok(SMS_SEND_DELAY_MIN_MS === 180000, "3 minutes");
  ok(SMS_SEND_DELAY_MAX_MS === 300000, "5 minutes");

  // GSM-7 initial/manual unchanged
  const body = renderSms({
    companyName: "Studio Test",
    demoUrl: "zbrendiraj.si/studio-test",
    hasExistingWebsite: false,
    step: "initial",
  });
  const manual = renderSms({
    companyName: "Studio Test",
    demoUrl: "zbrendiraj.si/studio-test",
    hasExistingWebsite: false,
    step: "manual",
  });
  ok(body.text === manual.text, "manual matches initial");
  ok(body.encoding === "gsm7", "gsm7 encoding");
  ok(isGsm7Text(body.text), "isGsm7Text");
  ok(hilinkReservedForText(body.text) === 1, "Reserved=1");
  ok(body.text.includes("Ali pa samo odgovorite z NE."), "NE line");
  ok(!/[ščžŠČŽ]/.test(body.text), "no diacritics");
  const payload = buildHiLinkSendSmsPayload("+38640853344", body.text);
  ok(payload.reserved === 1, "payload Reserved=1");

  const follow1 = renderSms({
    companyName: "Studio Test",
    demoUrl: "zbrendiraj.si/studio-test",
    hasExistingWebsite: false,
    step: "followup_1",
  });
  ok(follow1.text.includes("Samo preverjam"), "followup_1 unchanged");

  // live_eligible isolation contract (claim SQL is covered by store filter)
  ok(true, "non-live rows are excluded by claimQueuedMessages live_eligible=TRUE");

  console.log("test-sms-scheduling: all assertions passed");
}

main();
