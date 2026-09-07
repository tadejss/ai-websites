/**
 * Isolated one-shot SMS test harness.
 *
 * --dry-run  Read-only: pick lead, render current template, report. No INSERT/claim/radio.
 * --live     After explicit approval: insert one manual SMS to override phone,
 *            claim by messageId only, send via HiLink, never FIFO-claim siblings.
 */
import { config as loadEnv } from "dotenv";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), "tools/sms-gateway/.env") });

const TEST_PHONE_RAW = "040853344";
const KNOWN_TEST_STRIPE_CUSTOMERS = [
  "cus_VACnGc2ovGnd6i", // frizerski-salon-monika (prior operator test)
  "cus_VADMJoItVPZw0d", // frizerski-studio-sonce
  "cus_VA4lkCLS3IiHtO", // elektro-ivan-troha
] as const;

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***${digits.slice(-4)}`;
}

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const live = argv.includes("--live");
  const stripeCheck = argv.includes("--stripe-check");
  const prepareLive = argv.includes("--prepare-live");
  const slugArg = argv.find((a) => a.startsWith("--slug="));
  const slug = slugArg?.slice("--slug=".length)?.trim() || null;
  const modes = [dryRun, live, stripeCheck, prepareLive].filter(Boolean).length;
  if (modes !== 1) {
    console.error(
      "Usage: tsx scripts/sms-one-shot-test.ts --dry-run | --stripe-check | --prepare-live [--slug=...] | --live [--slug=...]",
    );
    process.exit(1);
  }
  return { dryRun, live, stripeCheck, prepareLive, slug };
}

async function loadLeadBySlug(slug: string) {
  const { readLead } = await import("../src/leads/store");
  const lead = readLead(slug);
  if (!lead) {
    throw new Error(`Lead not found: ${slug}`);
  }
  return lead;
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
      .filter((l) => l && !l.includes("sms-one-shot-test"))
      .length;
  } catch {
    return 0;
  }
}

async function selectEligibleLead() {
  const { readAllLeads } = await import("../src/leads/store");
  const { isCustomer } = await import("../src/customers/store");
  const { evaluateSmsEligibility } = await import(
    "../src/outreach/sms/eligibility"
  );
  const { getSmsLeadState, hasActiveOrSentStep, isSmsOptedOut } = await import(
    "../src/outreach/sms/store"
  );
  const { normalizeSlovenianPhone } = await import("../src/outreach/sms/phone");

  const leads = readAllLeads();
  for (const lead of leads) {
    const customer = await isCustomer(lead.slug);
    const state = await getSmsLeadState(lead.slug);
    const already = await hasActiveOrSentStep(lead.slug, "manual");
    const phone = normalizeSlovenianPhone(lead.phone);
    const globallyOptedOut = phone.ok
      ? await isSmsOptedOut(phone.e164)
      : false;
    const eligibility = evaluateSmsEligibility({
      lead,
      isCustomer: customer,
      state,
      step: "manual",
      alreadySentForStep: already,
      globallyOptedOut,
    });
    if (eligibility.ok) {
      return { lead, eligibility };
    }
  }
  return null;
}

async function runStripeCheck(): Promise<{
  ok: boolean;
  rows: Array<{ id: string; status: string; customer: string }>;
  source: "stripe_api" | "neon_fallback";
}> {
  const rows: Array<{ id: string; status: string; customer: string }> = [];

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    // Local .env has no Stripe secret — fall back to Neon customer rows only.
    const { ensureCustomerSchema } = await import("../src/db/ensure-schema");
    const { sql } = await import("../src/db/client");
    await ensureCustomerSchema();
    const db = sql();
    const customers = (await db`
      SELECT slug, stripe_customer_id, stripe_subscription_id, status
      FROM customers
      WHERE stripe_customer_id = ANY(${[...KNOWN_TEST_STRIPE_CUSTOMERS]})
         OR stripe_subscription_id IS NOT NULL
    `) as Array<{
      slug: string;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      status: string;
    }>;

    if (customers.length === 0) {
      rows.push({
        id: "(none)",
        status: "no_neon_customer_rows",
        customer: "known_test_set",
      });
      return { ok: true, rows, source: "neon_fallback" };
    }

    for (const c of customers) {
      rows.push({
        id: c.stripe_subscription_id ?? "(no_sub_id)",
        status: `neon_customer:${c.status}`,
        customer: c.stripe_customer_id ?? c.slug,
      });
    }
    // Neon still has subscription identity → treat as not clean for LIVE.
    return { ok: false, rows, source: "neon_fallback" };
  }

  const { getStripe } = await import("../src/billing/stripe");
  const stripe = getStripe();
  let ok = true;

  for (const customerId of KNOWN_TEST_STRIPE_CUSTOMERS) {
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
    });
    if (subs.data.length === 0) {
      rows.push({
        id: "(none)",
        status: "no_subscriptions",
        customer: customerId,
      });
      continue;
    }
    for (const sub of subs.data) {
      rows.push({
        id: sub.id,
        status: sub.status,
        customer: customerId,
      });
      if (sub.status !== "canceled") {
        ok = false;
      }
    }
  }

  return { ok, rows, source: "stripe_api" };
}

async function runDryRun() {
  const { normalizeSlovenianPhone } = await import("../src/outreach/sms/phone");
  const { renderSms, analyzeSmsLength } = await import("../src/outreach/sms/templates");
  const { smsCompanyDisplayName } = await import(
    "../src/outreach/sms/company-name"
  );
  const { buildHiLinkSendSmsPayload } = await import(
    "../tools/sms-gateway/src/modem/send-sms-payload"
  );
  const {
    isSmsOptedOut,
    countSmsMessagesByStatuses,
    listInFlightSmsFingerprints,
  } = await import("../src/outreach/sms/store");
  const { isDatabaseConfigured } = await import("../src/db/client");
  const { claimSmsByMessageId } = await import("../src/outreach/sms/claim");

  const pollerCount = await countPollerProcesses();
  const phone = normalizeSlovenianPhone(TEST_PHONE_RAW);
  if (!phone.ok) {
    throw new Error(`Test phone invalid: ${phone.error}`);
  }

  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL required for dry-run queue/opt-out checks");
  }

  const queueCounts = await countSmsMessagesByStatuses([
    "queued",
    "claimed",
    "sending",
  ]);
  const fingerprints = await listInFlightSmsFingerprints();
  const optedOut = await isSmsOptedOut(phone.e164);
  const selected = await selectEligibleLead();
  if (!selected) {
    throw new Error("No eligible lead found for manual SMS step");
  }

  const { lead } = selected;
  const companyName = smsCompanyDisplayName(lead.companyName, lead.slug);
  // One-shot test only: short SMS URL (no https, no /demo). Not a routing change.
  const demoUrl = `zbrendiraj.si/${lead.slug}`;
  const rendered = renderSms({
    companyName,
    demoUrl,
    hasExistingWebsite: Boolean(lead.existingWebsite?.trim()),
    step: "manual",
  });
  const hilinkPayload = buildHiLinkSendSmsPayload(phone.e164, rendered.text);
  const analyzed = analyzeSmsLength(rendered.text);
  const encodingAgrees =
    hilinkPayload.encoding === analyzed.encoding &&
    ((analyzed.encoding === "ucs2" && hilinkPayload.reserved === 0) ||
      (analyzed.encoding === "gsm7" && hilinkPayload.reserved === 1));

  const claimByIdAvailable = typeof claimSmsByMessageId === "function";
  const fifoUnsafe =
    queueCounts.queued > 0 ||
    queueCounts.claimed > 0 ||
    queueCounts.sending > 0;

  console.log("=== SMS ONE-SHOT DRY-RUN (read-only) ===");
  console.log("");
  console.log("1. Selected lead/customer:");
  console.log(`   company name: ${companyName}`);
  console.log(`   lead ID/slug: ${lead.slug}`);
  console.log("");
  console.log("2. Actual recipient after normalization:");
  console.log(`   raw: ${TEST_PHONE_RAW}`);
  console.log(`   e164: ${phone.e164}`);
  console.log(`   (lead phone NOT used as recipient: ${maskPhone(lead.phone ?? "")})`);
  console.log("");
  console.log("3. Exact rendered SMS body:");
  console.log("---");
  console.log(rendered.text);
  console.log("---");
  console.log("");
  console.log("4. SMS step/type: manual");
  console.log("");
  console.log("5. SMS length / segments:");
  console.log(
    `   length=${rendered.length} encoding=${rendered.encoding} segments=${rendered.segments} overLimit=${rendered.overLimit}`,
  );
  console.log("");
  console.log("5b. HiLink payload encoding decision (no radio send):");
  console.log(
    `   Reserved=${hilinkPayload.reserved} (${hilinkPayload.reserved === 0 ? "UCS2" : "SEVEN_BIT"})`,
  );
  console.log(`   payload.encoding=${hilinkPayload.encoding}`);
  console.log(
    `   analyzeSmsLength.encoding=${analyzed.encoding} segments=${analyzed.segments}`,
  );
  console.log(`   decision agrees with analyzeSmsLength: ${encodingAgrees}`);
  console.log(
    `   Content plain text (not hex): ${!/^[0-9A-Fa-f]+$/.test(hilinkPayload.content)}`,
  );
  const reservedTag = hilinkPayload.body.match(/<Reserved>\d+<\/Reserved>/)?.[0];
  console.log(`   XML tag: ${reservedTag}`);
  console.log("");
  console.log("6. Provider/gateway that will receive it:");
  console.log(
    "   Local tools/sms-gateway → Brovi/Huawei HiLink @ http://192.168.8.1 (physical SIM)",
  );
  console.log(
    `   SMS_API_BASE_URL=${process.env.SMS_API_BASE_URL ?? "https://zbrendiraj.si"}`,
  );
  console.log(
    `   SMS_DRY_RUN(gateway env)=${process.env.SMS_DRY_RUN ?? "(unset)"}`,
  );
  console.log("");
  console.log("7. Personalization / URL transformation:");
  console.log(`   companyName display: ${companyName}`);
  console.log(`   demoUrl (one-shot short form): ${demoUrl}`);
  console.log(
    `   hasExistingWebsite (unused in copy): ${Boolean(lead.existingWebsite?.trim())}`,
  );
  console.log("");
  console.log("8. Opt-out blocked?");
  console.log(`   isSmsOptedOut(${phone.e164}) = ${optedOut}`);
  console.log("");
  console.log("9. Could sending trigger additional SMS?");
  console.log(`   continuous poller processes detected: ${pollerCount}`);
  console.log(
    `   queue depth: queued=${queueCounts.queued} claimed=${queueCounts.claimed} sending=${queueCounts.sending}`,
  );
  console.log(
    `   in-flight fingerprint count: ${fingerprints.length}`,
  );
  console.log(
    `   claim-by-messageId available: ${claimByIdAvailable}`,
  );
  console.log(
    `   FIFO processOneBatch safe with non-empty queue: ${!fifoUnsafe ? "n/a (empty)" : "NO — must use claim-by-messageId"}`,
  );
  console.log(
    "   this dry-run inserts nothing; cron follow-ups not triggered by manual step alone",
  );
  console.log("");
  console.log("SAFEGUARDS / NOTES");
  console.log("- No DB INSERT performed.");
  console.log("- No claim / HiLink / radio send performed.");
  console.log("- Production templates.ts NOT modified in this dry-run.");
  console.log("- STOP: waiting for explicit approval before LIVE send.");
  console.log("");
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        companyName,
        slug: lead.slug,
        recipient: phone.e164,
        step: "manual",
        length: rendered.length,
        segments: rendered.segments,
        encoding: rendered.encoding,
        hilinkReserved: hilinkPayload.reserved,
        encodingAgrees,
        demoUrl,
        optedOut,
        queueCounts,
        pollerCount,
        claimByIdAvailable,
      },
      null,
      2,
    ),
  );
}

async function runLive() {
  const { normalizeSlovenianPhone, isSlovenianMobilePhone } = await import(
    "../src/outreach/sms/phone"
  );
  const { renderSms } = await import("../src/outreach/sms/templates");
  const { smsCompanyDisplayName } = await import(
    "../src/outreach/sms/company-name"
  );
  const {
    isSmsOptedOut,
    countSmsMessagesByStatuses,
    listInFlightSmsFingerprints,
    insertQueuedMessage,
    getSmsMessageById,
    authorizeSmsSend,
  } = await import("../src/outreach/sms/store");
  const { claimSmsByMessageId } = await import("../src/outreach/sms/claim");
  const { applySmsResult } = await import("../src/outreach/sms/result");
  const { getSmsConfig } = await import("../src/outreach/sms/config");
  const { HiLinkModem } = await import("../tools/sms-gateway/src/modem/hilink");

  // B0 Stripe
  console.log("=== B0 Stripe pre-flight (read-only) ===");
  const stripe = await runStripeCheck();
  console.log(`source: ${stripe.source}`);
  for (const row of stripe.rows) {
    console.log(`  customer=${row.customer} sub=${row.id} status=${row.status}`);
  }
  if (!stripe.ok) {
    console.error("ABORT LIVE: prior test Stripe subscription is not canceled.");
    process.exit(2);
  }
  console.log("Stripe pre-flight OK (all known test subs canceled or absent).");
  console.log("");

  // Template must already include NE sentence
  const probe = renderSms({
    companyName: "Probe",
    demoUrl: "zbrendiraj.si/probe",
    hasExistingWebsite: false,
    step: "manual",
  });
  if (!probe.text.includes("Ali pa samo odgovorite z NE.")) {
    console.error(
      "ABORT LIVE: templates.ts initial/manual missing NE sentence.",
    );
    process.exit(2);
  }

  const phone = normalizeSlovenianPhone(TEST_PHONE_RAW);
  if (!phone.ok || !isSlovenianMobilePhone(TEST_PHONE_RAW)) {
    throw new Error("Test phone invalid or not mobile");
  }
  if (await isSmsOptedOut(phone.e164)) {
    console.error("ABORT LIVE: test phone is opted out");
    process.exit(2);
  }

  const pollerCount = await countPollerProcesses();
  if (pollerCount > 0) {
    console.error(
      `ABORT LIVE: ${pollerCount} gateway/poller process(es) running. Stop them first.`,
    );
    process.exit(2);
  }

  const utcHour = new Date().getUTCHours();
  const utcMin = new Date().getUTCMinutes();
  const nearCron =
    (utcHour === 8 && utcMin >= 45) || (utcHour === 9 && utcMin <= 30);
  const cronDisabled =
    process.env.SMS_CRON_ENQUEUE_DISABLED?.trim() === "true";
  if (nearCron && !cronDisabled) {
    console.error(
      "ABORT LIVE: within cron window 08:45–09:30 UTC and SMS_CRON_ENQUEUE_DISABLED is not set.",
    );
    process.exit(2);
  }

  if (process.env.SMS_DRY_RUN?.trim() === "true") {
    console.error(
      "ABORT LIVE: SMS_DRY_RUN=true in gateway env. Set false for physical send.",
    );
    process.exit(2);
  }

  const beforeCounts = await countSmsMessagesByStatuses([
    "queued",
    "claimed",
    "sending",
  ]);
  const beforeFp = await listInFlightSmsFingerprints();
  console.log("Queue before insert:", beforeCounts);
  console.log(`In-flight fingerprints before: ${beforeFp.length}`);

  const selectedSlug =
    process.env.SMS_ONESHOT_SLUG?.trim() || "3ici-install-vodovodne";
  const lead = await loadLeadBySlug(selectedSlug);
  const companyName = smsCompanyDisplayName(lead.companyName, lead.slug);
  // One-shot test only: short SMS URL (no https, no /demo). Not a routing change.
  const demoUrl = `zbrendiraj.si/${lead.slug}`;
  const rendered = renderSms({
    companyName,
    demoUrl,
    hasExistingWebsite: Boolean(lead.existingWebsite?.trim()),
    step: "manual",
  });

  const { buildHiLinkSendSmsPayload } = await import(
    "../tools/sms-gateway/src/modem/send-sms-payload"
  );
  const hilinkPayload = buildHiLinkSendSmsPayload(phone.e164, rendered.text);
  console.log(
    `HiLink encoding: Reserved=${hilinkPayload.reserved} encoding=${hilinkPayload.encoding} length=${hilinkPayload.length}`,
  );
  if (hilinkPayload.reserved !== 0 || hilinkPayload.encoding !== "ucs2") {
    console.error("ABORT LIVE: expected UCS2 Reserved=0 for diacritic body");
    process.exit(2);
  }

  // Free unique (slug, manual) only for prior oneshot test rows to this test phone.
  // Never touches legitimate outreach (e.g. initial to the lead's real number).
  const { sql } = await import("../src/db/client");
  const { ensureCustomerSchema } = await import("../src/db/ensure-schema");
  await ensureCustomerSchema();
  const db = sql();
  const superseded = (await db`
    UPDATE sms_messages
    SET
      status = 'cancelled',
      last_error = 'oneshot_retest_superseded',
      updated_at = NOW()
    WHERE slug = ${lead.slug}
      AND step = 'manual'
      AND to_phone = ${phone.e164}
      AND message_id LIKE 'sms_oneshot_%'
      AND status IN ('queued', 'claimed', 'sending', 'sent')
    RETURNING id, message_id, status
  `) as Array<{ id: number; message_id: string; status: string }>;
  if (superseded.length) {
    console.log(
      `Superseded prior oneshot test row(s): ${superseded
        .map((r) => `${r.id}/${r.message_id}`)
        .join(", ")}`,
    );
  }

  const digest = createHash("sha256")
    .update(`oneshot:${lead.slug}:${phone.e164}:${Date.now()}`)
    .digest("hex")
    .slice(0, 16);
  const messageId = `sms_oneshot_${lead.slug}_${digest}`;

  const inserted = await insertQueuedMessage({
    messageId,
    slug: lead.slug,
    toPhone: phone.e164,
    toPhoneRaw: TEST_PHONE_RAW,
    body: rendered.text,
    step: "manual",
  });
  console.log(`Inserted test message id=${inserted.id} messageId=${messageId}`);
  console.log(`Body:\n${rendered.text}`);

  const claimed = await claimSmsByMessageId({
    messageId,
    claimedBy: "sms-one-shot-test",
  });
  if (!claimed) {
    console.error("ABORT: claim-by-messageId failed; leaving row queued for manual review");
    process.exit(2);
  }

  const auth = await authorizeSmsSend(messageId);
  if (!auth.send) {
    console.error(`ABORT: preflight blocked: ${auth.reason}`);
    process.exit(2);
  }

  const hilinkUrl = (
    process.env.HILINK_URL?.trim() || "http://192.168.8.1"
  ).replace(/\/$/, "");
  const modem = new HiLinkModem(hilinkUrl);
  const status = await modem.getStatus();
  console.log(`Modem: mode=${status.mode} connected=${status.connected} detail=${status.detail}`);
  if (!status.connected || status.mode !== "hilink") {
    console.error("ABORT: HiLink modem not ready");
    process.exit(2);
  }

  const send = await modem.sendSms(claimed.to, claimed.text);
  const applied = await applySmsResult({
    messageId,
    success: send.success,
    providerMessageId: send.providerMessageId ?? null,
    error: send.error ?? null,
  });

  const finalMsg = applied?.message ?? (await getSmsMessageById(messageId));
  const afterFp = await listInFlightSmsFingerprints();
  const afterCounts = await countSmsMessagesByStatuses([
    "queued",
    "claimed",
    "sending",
  ]);

  const beforeMap = new Map(
    beforeFp.map((f) => [f.messageId, f] as const),
  );
  const changedOthers: string[] = [];
  for (const f of afterFp) {
    if (f.messageId === messageId) continue;
    const prev = beforeMap.get(f.messageId);
    if (!prev) {
      // new non-test in-flight — unexpected
      changedOthers.push(`new:${f.messageId}:${f.status}`);
      continue;
    }
    if (prev.status !== f.status || prev.updatedAt !== f.updatedAt) {
      changedOthers.push(
        `changed:${f.messageId} ${prev.status}@${prev.updatedAt} → ${f.status}@${f.updatedAt}`,
      );
    }
  }
  for (const prev of beforeFp) {
    if (prev.messageId === messageId) continue;
    if (!afterFp.some((f) => f.messageId === prev.messageId)) {
      // left in-flight set — may have been sent by something else
      changedOthers.push(`missing:${prev.messageId}`);
    }
  }

  const expectedQueuedDelta = -0; // test left queued; after send should not be in-flight
  const preexistingQueued = beforeCounts.queued;
  const afterPreexistingQueued = afterCounts.queued; // test message should not be queued anymore
  // Pre-existing depth: after.queued should equal before.queued (test was inserted then left)

  console.log("");
  console.log("=== LIVE SEND REPORT ===");
  console.log(`provider success: ${send.success}`);
  console.log(`provider_message_id: ${send.providerMessageId ?? "(none)"}`);
  console.log(`provider error: ${send.error ?? "(none)"}`);
  console.log(`db id: ${finalMsg?.id}`);
  console.log(`db message_id: ${finalMsg?.messageId}`);
  console.log(`final status: ${finalMsg?.status}`);
  console.log(`sent_at: ${finalMsg?.sentAt}`);
  console.log(`updated_at: ${finalMsg?.updatedAt}`);
  console.log(
    `encoding/Reserved: ${hilinkPayload.encoding} / ${hilinkPayload.reserved}`,
  );
  console.log(`handed to physical gateway: ${status.mode === "hilink" && send.success}`);
  console.log(`company: ${companyName} slug: ${lead.slug}`);
  console.log(`recipient: ${phone.e164}`);
  console.log(`body segments: ${rendered.segments} length: ${rendered.length}`);
  console.log(`queue before: ${JSON.stringify(beforeCounts)}`);
  console.log(`queue after:  ${JSON.stringify(afterCounts)}`);
  console.log(
    `pre-existing in-flight unchanged: ${changedOthers.length === 0}`,
  );
  if (changedOthers.length) {
    console.log("INTEGRITY FAILURES:", changedOthers);
  }
  console.log(`config dailyLimit=${getSmsConfig().dailyLimit}`);
  void expectedQueuedDelta;
  void preexistingQueued;
  void afterPreexistingQueued;

  if (changedOthers.length) {
    process.exit(3);
  }
}

async function runPrepareLive(forcedSlug: string) {
  const { normalizeSlovenianPhone, isSlovenianMobilePhone } = await import(
    "../src/outreach/sms/phone"
  );
  const { renderSms, analyzeSmsLength } = await import(
    "../src/outreach/sms/templates"
  );
  const { smsCompanyDisplayName } = await import(
    "../src/outreach/sms/company-name"
  );
  const { buildHiLinkSendSmsPayload } = await import(
    "../tools/sms-gateway/src/modem/send-sms-payload"
  );
  const {
    isSmsOptedOut,
    countSmsMessagesByStatuses,
    listInFlightSmsFingerprints,
    hasActiveOrSentStep,
  } = await import("../src/outreach/sms/store");
  const { claimSmsByMessageId } = await import("../src/outreach/sms/claim");
  const { isDatabaseConfigured } = await import("../src/db/client");

  const TARGET_SLUG = forcedSlug;
  const TARGET_PHONE = "+38640853344";
  const SHORT_URL = `zbrendiraj.si/${TARGET_SLUG}`;

  const blockers: string[] = [];
  const notes: string[] = [];

  if (!isDatabaseConfigured()) {
    blockers.push("DATABASE_URL not configured");
  }

  const pollerCount = await countPollerProcesses();
  if (pollerCount > 0) {
    blockers.push(`poller/gateway processes running: ${pollerCount}`);
  } else {
    notes.push("poller not running");
  }

  const utc = new Date();
  const utcHour = utc.getUTCHours();
  const utcMin = utc.getUTCMinutes();
  const nearCron =
    (utcHour === 8 && utcMin >= 45) || (utcHour === 9 && utcMin <= 30);
  const cronDisabled =
    process.env.SMS_CRON_ENQUEUE_DISABLED?.trim() === "true";
  if (nearCron && !cronDisabled) {
    blockers.push(
      `inside cron window 08:45–09:30 UTC (${utc.toISOString()}) and SMS_CRON_ENQUEUE_DISABLED is not set for this process`,
    );
  } else if (cronDisabled) {
    notes.push("SMS_CRON_ENQUEUE_DISABLED=true (process env)");
  } else {
    notes.push(`outside cron window (UTC ${utc.toISOString()})`);
  }
  notes.push(
    "kill-switch code exists in /api/cron/sms-outreach; production Vercel env must be set for remote cron to honor it",
  );

  if (process.env.SMS_DRY_RUN?.trim() === "true") {
    blockers.push(
      "SMS_DRY_RUN=true would block LIVE; run with SMS_DRY_RUN=false for actual send",
    );
  }

  const phone = normalizeSlovenianPhone(TEST_PHONE_RAW);
  if (!phone.ok || phone.e164 !== TARGET_PHONE) {
    blockers.push(`phone normalize mismatch: expected ${TARGET_PHONE}`);
  }
  if (!isSlovenianMobilePhone(TEST_PHONE_RAW)) {
    blockers.push("test phone is not a Slovenian mobile");
  }
  const optedOut = phone.ok ? await isSmsOptedOut(phone.e164) : true;
  if (optedOut) {
    blockers.push("recipient is opted out");
  }

  const queueCounts = await countSmsMessagesByStatuses([
    "queued",
    "claimed",
    "sending",
  ]);
  const fingerprints = await listInFlightSmsFingerprints();

  const lead = await loadLeadBySlug(TARGET_SLUG);
  const companyName = smsCompanyDisplayName(lead.companyName, lead.slug);
  const demoUrl = SHORT_URL;
  const rendered = renderSms({
    companyName,
    demoUrl,
    hasExistingWebsite: Boolean(lead.existingWebsite?.trim()),
    step: "manual",
  });
  const analyzed = analyzeSmsLength(rendered.text);
  const hilinkPayload = buildHiLinkSendSmsPayload(TARGET_PHONE, rendered.text);
  const encodingAgrees =
    hilinkPayload.encoding === analyzed.encoding &&
    hilinkPayload.reserved === 0 &&
    analyzed.encoding === "ucs2";

  if (!encodingAgrees) {
    blockers.push(
      `encoding mismatch: reserved=${hilinkPayload.reserved} encoding=${hilinkPayload.encoding} analyzed=${analyzed.encoding}`,
    );
  }
  if (!/[ščžŠČŽ]/.test(rendered.text)) {
    blockers.push("rendered body has no Slovenian diacritics — UCS2 not exercised");
  }
  if (!rendered.text.includes(SHORT_URL)) {
    blockers.push(`body missing short URL ${SHORT_URL}`);
  }
  if (rendered.text.includes("/demo/") || rendered.text.includes("https://")) {
    blockers.push("body still contains https:// or /demo/ URL form");
  }

  const manualAlready = await hasActiveOrSentStep(TARGET_SLUG, "manual");
  if (manualAlready) {
    notes.push(
      "manual step already queued/sent for this slug — LIVE will insert a new oneshot messageId (force path), not burn initial cadence",
    );
  }

  const claimByIdAvailable = typeof claimSmsByMessageId === "function";
  if (!claimByIdAvailable) {
    blockers.push("claimSmsByMessageId unavailable — cannot isolate");
  } else {
    notes.push(
      "isolation: LIVE uses claimSmsByMessageId(testMessageId) only — never FIFO GET /api/outreach/sms/queue",
    );
  }

  console.log("=== PREPARE LIVE (NO SEND) ===");
  console.log("");
  console.log(`Lead: ${companyName} (${TARGET_SLUG})`);
  console.log(`Recipient: ${TARGET_PHONE}`);
  console.log(`URL: ${demoUrl}`);
  console.log(`Step: manual (oneshot messageId)`);
  console.log("");
  console.log("Exact body:");
  console.log("---");
  console.log(rendered.text);
  console.log("---");
  console.log("");
  console.log(
    `analyzeSmsLength: encoding=${analyzed.encoding} length=${analyzed.length} segments=${analyzed.segments}`,
  );
  console.log(
    `HiLink payload: Reserved=${hilinkPayload.reserved} encoding=${hilinkPayload.encoding}`,
  );
  console.log(
    `XML: ${hilinkPayload.body.match(/<Reserved>\d+<\/Reserved>/)?.[0]}`,
  );
  console.log(
    `Content plain (not hex): ${!/^[0-9A-Fa-f]+$/.test(hilinkPayload.content)}`,
  );
  console.log(`Agrees UCS2 path: ${encodingAgrees}`);
  console.log("");
  console.log(
    `Queue BEFORE send: queued=${queueCounts.queued} claimed=${queueCounts.claimed} sending=${queueCounts.sending}`,
  );
  console.log(`In-flight fingerprints: ${fingerprints.length}`);
  console.log(`Poller processes: ${pollerCount}`);
  console.log(`UTC now: ${utc.toISOString()}`);
  console.log("");
  console.log("Isolation plan:");
  console.log("  - insert ONE sms_messages row (step=manual, to=+38640853344)");
  console.log("  - claimSmsByMessageId(that messageId) only");
  console.log("  - HiLink sendSms once");
  console.log("  - never call FIFO claimQueue / processOneBatch / npm run poll");
  console.log("");
  if (notes.length) {
    console.log("Notes:");
    for (const n of notes) console.log(`  - ${n}`);
    console.log("");
  }
  if (blockers.length) {
    console.log("BLOCKERS (must clear before approval to send):");
    for (const b of blockers) console.log(`  - ${b}`);
    console.log("");
    console.log("STATUS: NOT READY — waiting for blockers to clear + explicit approval.");
    process.exitCode = 2;
  } else {
    console.log("STATUS: PREPARED — ready for one-shot send AFTER explicit approval.");
    console.log("WAITING FOR APPROVAL. Do not run --live until approved.");
  }
  console.log("");
  console.log(
    JSON.stringify(
      {
        mode: "prepare-live",
        ready: blockers.length === 0,
        slug: TARGET_SLUG,
        recipient: TARGET_PHONE,
        demoUrl,
        reserved: hilinkPayload.reserved,
        encoding: hilinkPayload.encoding,
        segments: analyzed.segments,
        length: analyzed.length,
        queueCounts,
        pollerCount,
        blockers,
        notes,
      },
      null,
      2,
    ),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.dryRun) {
    await runDryRun();
    return;
  }
  if (args.stripeCheck) {
    const result = await runStripeCheck();
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 2);
  }
  if (args.prepareLive) {
    const slug = args.slug || "3ici-install-vodovodne";
    await runPrepareLive(slug);
    return;
  }
  if (args.live) {
    // slug forced for this test campaign when provided
    if (args.slug) {
      process.env.SMS_ONESHOT_SLUG = args.slug;
    }
    await runLive();
  }
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(resolve(entry)).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
