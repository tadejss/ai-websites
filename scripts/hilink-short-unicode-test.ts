/**
 * Isolated Brovi HiLink short Unicode experiment.
 *
 * Opt-in only. Does NOT run in normal npm test suites.
 * Does NOT touch production templates, cron, poller, or FIFO queue claim.
 *
 * Usage:
 *   npx tsx scripts/hilink-short-unicode-test.ts --dry-run
 *   SMS_CRON_ENQUEUE_DISABLED=true SMS_DRY_RUN=false \\
 *     npx tsx scripts/hilink-short-unicode-test.ts --live
 *
 * Test body (single UCS2 segment when Reserved=0 works):
 *   Živjo! Test ščž. Tadej
 */
import { config as loadEnv } from "dotenv";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { analyzeSmsLength } from "../src/outreach/sms/templates";
import { buildHiLinkSendSmsPayload } from "../tools/sms-gateway/src/modem/send-sms-payload";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), "tools/sms-gateway/.env") });

const TEST_BODY = "Živjo! Test ščž. Tadej";
const TEST_PHONE_RAW = "040853344";
const TEST_PHONE_E164 = "+38640853344";
/** Synthetic slug — avoids unique (slug,step) clash with real lead outreach. */
const TEST_SLUG = "__hilink_unicode_probe__";
const TEST_STEP = "manual" as const;

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const live = argv.includes("--live");
  if ([dryRun, live].filter(Boolean).length !== 1) {
    console.error(
      "Usage: tsx scripts/hilink-short-unicode-test.ts --dry-run | --live",
    );
    process.exit(1);
  }
  return { dryRun, live };
}

async function countPollerProcesses(): Promise<number> {
  const { execSync } = await import("node:child_process");
  try {
    const out = execSync(
      "pgrep -fl 'sms-gateway|tools/sms-gateway|tsx.*poller' || true",
      { encoding: "utf8" },
    );
    return out
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.includes("hilink-short-unicode-test"))
      .length;
  } catch {
    return 0;
  }
}

async function readSplitInfo(base: string, cookie: string, token: string) {
  const res = await fetch(`${base}/api/sms/splitinfo-sms`, {
    headers: {
      Cookie: cookie,
      __RequestVerificationToken: token,
      Accept: "*/*",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  const xml = await res.text();
  const pick = (tag: string) =>
    xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1] ?? null;
  return {
    splitinfo: pick("splitinfo"),
    convert_type: pick("convert_type"),
    xmlHead: xml.slice(0, 300),
  };
}

async function readSentBoxMeta(base: string, cookie: string, token: string) {
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<request><PageIndex>1</PageIndex><ReadCount>5</ReadCount>` +
    `<BoxType>2</BoxType><SortType>0</SortType><Ascending>0</Ascending>` +
    `<UnreadPreferred>0</UnreadPreferred></request>`;
  const res = await fetch(`${base}/api/sms/sms-list`, {
    method: "POST",
    headers: {
      Cookie: cookie,
      __RequestVerificationToken: token,
      Accept: "*/*",
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Origin: base,
    },
    body,
  });
  const xml = await res.text();
  const blocks = xml.split(/<Message>/i).slice(1);
  return blocks.map((block) => {
    const get = (tag: string) =>
      block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"))?.[1] ??
      null;
    const content = get("Content") || "";
    const smsType = get("SmsType");
    return {
      phoneSuffix: (get("Phone") || "").replace(/\D/g, "").slice(-4),
      date: get("Date"),
      smsType,
      smsTypeMeaning:
        smsType === "5"
          ? "UNICODE"
          : smsType === "2"
            ? "MULTIPART"
            : smsType === "1"
              ? "SINGLE"
              : smsType,
      contentLen: content.length,
      hasDiacritics: /[ščžŠČŽ]/.test(content),
      hasExactBody: content.includes(TEST_BODY) || content === TEST_BODY,
      contentPreview: content.slice(0, 40),
    };
  });
}

async function hilinkSession(base: string) {
  const tokRes = await fetch(`${base}/api/webserver/SesTokInfo`);
  const tokXml = await tokRes.text();
  const cookie =
    tokRes.headers.get("set-cookie")?.split(";")[0] ||
    tokXml.match(/<SesInfo>([^<]+)<\/SesInfo>/)?.[1] ||
    "";
  const token = tokXml.match(/<TokInfo>([^<]+)<\/TokInfo>/)?.[1] || "";
  return { cookie, token };
}

function reportPayload() {
  const analyzed = analyzeSmsLength(TEST_BODY);
  const payload = buildHiLinkSendSmsPayload(TEST_PHONE_E164, TEST_BODY);
  const contentIsHex = /^[0-9A-Fa-f]+$/.test(payload.content);
  const reservedXml =
    payload.body.match(/<Reserved>\d+<\/Reserved>/)?.[0] ?? null;
  const lengthXml = payload.body.match(/<Length>\d+<\/Length>/)?.[0] ?? null;
  const contentXml = payload.body.match(/<Content>([\s\S]*?)<\/Content>/)?.[1];

  console.log("=== SHORT UNICODE HARNESS — PAYLOAD ===");
  console.log(`Body: ${TEST_BODY}`);
  console.log(`Recipient: ${TEST_PHONE_E164}`);
  console.log(`Synthetic slug: ${TEST_SLUG} (no real-lead outreach collision)`);
  console.log("");
  console.log("analyzeSmsLength:");
  console.log(
    `  encoding=${analyzed.encoding} length=${analyzed.length} segments=${analyzed.segments} overLimit=${analyzed.overLimit}`,
  );
  console.log("");
  console.log("HiLink XML fields:");
  console.log(`  Content: ${contentXml}`);
  console.log(`  Length: ${payload.length} (${lengthXml})`);
  console.log(
    `  Reserved: ${payload.reserved} (${reservedXml}) → ${payload.reserved === 0 ? "UCS2" : "SEVEN_BIT"}`,
  );
  console.log(
    `  Content format: ${contentIsHex ? "HEX" : "plain text (UTF-8 XML)"}`,
  );
  console.log("");
  console.log("Exact XML body:");
  console.log(payload.body);
  console.log("");
  console.log("Expected interpretation if modem honors Reserved=0:");
  console.log("  - single-segment UCS2 (length 22 <= 70)");
  console.log("  - air path Unicode (SENT SmsType ideally 5=UNICODE, not GSM multipart convert)");
  console.log("  - phone displays š/č/ž (not s/c/z)");
  console.log("If phone still shows scz and/or SmsType stays 2:");
  console.log("  - plain Content + Reserved=0 is insufficient on this Brovi firmware");
  console.log("");

  return { analyzed, payload, contentIsHex };
}

async function runDryRun() {
  const poller = await countPollerProcesses();
  const { analyzed, payload, contentIsHex } = reportPayload();

  const { countSmsMessagesByStatuses } = await import(
    "../src/outreach/sms/store"
  );
  const queue = await countSmsMessagesByStatuses([
    "queued",
    "claimed",
    "sending",
  ]);

  console.log("=== DRY-RUN SAFEGUARDS ===");
  console.log(`poller processes: ${poller}`);
  console.log(
    `queue (untouched): queued=${queue.queued} claimed=${queue.claimed} sending=${queue.sending}`,
  );
  console.log(
    `SMS_CRON_ENQUEUE_DISABLED: ${process.env.SMS_CRON_ENQUEUE_DISABLED ?? "(unset — set true for LIVE)"}`,
  );
  console.log(
    `SMS_DRY_RUN: ${process.env.SMS_DRY_RUN ?? "(unset)"}`,
  );
  console.log("");
  console.log("STATUS: DRY-RUN ONLY — no INSERT, no claim, no modem send.");
  console.log("WAITING FOR APPROVAL before --live.");
  console.log("");
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        body: TEST_BODY,
        recipient: TEST_PHONE_E164,
        reserved: payload.reserved,
        encoding: payload.encoding,
        length: payload.length,
        segments: analyzed.segments,
        contentIsHex,
        poller,
        queue,
      },
      null,
      2,
    ),
  );
}

async function runLive() {
  if (process.env.SMS_DRY_RUN?.trim() === "true") {
    console.error("ABORT: SMS_DRY_RUN=true — refuse LIVE short-unicode send");
    process.exit(2);
  }
  if (process.env.SMS_CRON_ENQUEUE_DISABLED?.trim() !== "true") {
    console.error(
      "ABORT: SMS_CRON_ENQUEUE_DISABLED must be true for this experiment",
    );
    process.exit(2);
  }
  const poller = await countPollerProcesses();
  if (poller > 0) {
    console.error(`ABORT: poller running (${poller})`);
    process.exit(2);
  }

  const { analyzed, payload } = reportPayload();
  if (payload.reserved !== 0 || analyzed.encoding !== "ucs2") {
    console.error("ABORT: expected UCS2 Reserved=0 for test body");
    process.exit(2);
  }
  if (analyzed.segments !== 1) {
    console.error(
      `ABORT: expected single segment, got segments=${analyzed.segments}`,
    );
    process.exit(2);
  }

  const {
    countSmsMessagesByStatuses,
    listInFlightSmsFingerprints,
    insertQueuedMessage,
    getSmsMessageById,
    authorizeSmsSend,
  } = await import("../src/outreach/sms/store");
  const { claimSmsByMessageId } = await import("../src/outreach/sms/claim");
  const { applySmsResult } = await import("../src/outreach/sms/result");
  const { HiLinkModem } = await import("../tools/sms-gateway/src/modem/hilink");

  const before = await countSmsMessagesByStatuses([
    "queued",
    "claimed",
    "sending",
  ]);
  const beforeFp = await listInFlightSmsFingerprints();
  console.log("Queue before:", before);

  const digest = createHash("sha256")
    .update(`shortunicode:${TEST_PHONE_E164}:${Date.now()}`)
    .digest("hex")
    .slice(0, 16);
  const messageId = `sms_oneshot_${TEST_SLUG}_${digest}`;

  const inserted = await insertQueuedMessage({
    messageId,
    slug: TEST_SLUG,
    toPhone: TEST_PHONE_E164,
    toPhoneRaw: TEST_PHONE_RAW,
    body: TEST_BODY,
    step: TEST_STEP,
    liveEligible: false,
  });
  console.log(`Inserted id=${inserted.id} messageId=${messageId}`);

  const claimed = await claimSmsByMessageId({
    messageId,
    claimedBy: "hilink-short-unicode-test",
  });
  if (!claimed) {
    console.error("ABORT: claim-by-messageId failed");
    process.exit(2);
  }

  const auth = await authorizeSmsSend(messageId, {
    bypassCampaignGuards: true,
  });
  if (!auth.send) {
    console.error(`ABORT: preflight blocked: ${auth.reason}`);
    process.exit(2);
  }

  const hilinkUrl = (
    process.env.HILINK_URL?.trim() || "http://192.168.8.1"
  ).replace(/\/$/, "");
  const modem = new HiLinkModem(hilinkUrl);
  const status = await modem.getStatus();
  if (!status.connected || status.mode !== "hilink") {
    console.error("ABORT: HiLink not ready");
    process.exit(2);
  }

  // Use the exact payload builder body path via modem.sendSms (same Reserved logic)
  const send = await modem.sendSms(claimed.to, claimed.text);
  await applySmsResult({
    messageId,
    success: send.success,
    providerMessageId: send.providerMessageId ?? null,
    error: send.error ?? null,
  });
  const finalMsg = await getSmsMessageById(messageId);

  const session = await hilinkSession(hilinkUrl);
  const split = await readSplitInfo(
    hilinkUrl,
    session.cookie,
    session.token,
  );
  const sentMeta = await readSentBoxMeta(
    hilinkUrl,
    session.cookie,
    session.token,
  );
  const after = await countSmsMessagesByStatuses([
    "queued",
    "claimed",
    "sending",
  ]);
  const afterFp = await listInFlightSmsFingerprints();
  const changedOthers = afterFp.filter(
    (f) =>
      f.messageId !== messageId &&
      beforeFp.some(
        (b) =>
          b.messageId === f.messageId &&
          (b.status !== f.status || b.updatedAt !== f.updatedAt),
      ),
  );

  console.log("");
  console.log("=== LIVE SHORT UNICODE REPORT ===");
  console.log(`provider success: ${send.success}`);
  console.log(`provider_message_id: ${send.providerMessageId ?? "(none)"}`);
  console.log(`db id: ${finalMsg?.id}`);
  console.log(`db message_id: ${finalMsg?.messageId}`);
  console.log(`final status: ${finalMsg?.status}`);
  console.log(
    `Reserved/encoding: ${payload.reserved} / ${payload.encoding}`,
  );
  console.log(`splitinfo: ${split.splitinfo}`);
  console.log(`convert_type: ${split.convert_type}`);
  console.log("SENT box (latest):");
  console.log(JSON.stringify(sentMeta.slice(0, 3), null, 2));
  console.log(`queue before: ${JSON.stringify(before)}`);
  console.log(`queue after:  ${JSON.stringify(after)}`);
  console.log(`other in-flight changed: ${changedOthers.length > 0}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.dryRun) {
    await runDryRun();
    return;
  }
  await runLive();
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(resolve(entry)).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
