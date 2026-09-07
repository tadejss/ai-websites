import { pathToFileURL } from "node:url";
import { loadGatewayConfig, type GatewayConfig } from "./config";
import { detectModem } from "./modem/detect";
import { HiLinkModem } from "./modem/hilink";
import type { IncomingSms, SmsModem } from "./modem/types";

type QueueMessage = {
  messageId: string;
  to: string;
  text: string;
};

type BudgetSnapshot = {
  localDate: string;
  target: number;
  sent: number;
  remaining: number;
  sendWindowOpen: boolean;
};

const seenInbound = new Set<string>();

export const SMS_SEND_DELAY_MIN_MS = 180_000;
export const SMS_SEND_DELAY_MAX_MS = 300_000;

export function randomSendDelayMs(
  random: () => number = Math.random,
): number {
  const span = SMS_SEND_DELAY_MAX_MS - SMS_SEND_DELAY_MIN_MS + 1;
  return SMS_SEND_DELAY_MIN_MS + Math.floor(random() * span);
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) {
    return "***";
  }
  return `***${digits.slice(-4)}`;
}

async function apiFetch(
  config: GatewayConfig,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.gatewaySecret}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(30000),
  });
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function reportResult(
  config: GatewayConfig,
  payload: {
    messageId: string;
    success: boolean;
    providerMessageId?: string;
    error?: string;
  },
): Promise<void> {
  const response = await apiFetch(config, "/api/outreach/sms/result", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Result API ${response.status}: ${text.slice(0, 200)}`);
  }
}

export async function authorizeSend(
  config: GatewayConfig,
  messageId: string,
): Promise<{ send: boolean; reason?: string }> {
  const response = await apiFetch(config, "/api/outreach/sms/preflight", {
    method: "POST",
    body: JSON.stringify({ messageId }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Preflight API ${response.status}: ${text.slice(0, 200)}`);
  }
  return (await response.json()) as { send: boolean; reason?: string };
}

export async function fetchDailyBudget(
  config: GatewayConfig,
): Promise<BudgetSnapshot | null> {
  const response = await apiFetch(config, "/api/outreach/sms/budget");
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Budget API ${response.status}: ${text.slice(0, 200)}`);
  }
  const data = (await response.json()) as BudgetSnapshot & { ok?: boolean };
  return data;
}

export async function pushInbound(
  config: GatewayConfig,
  message: IncomingSms,
): Promise<{ ok: boolean; isOptOut?: boolean; keyword?: string | null }> {
  const response = await apiFetch(config, "/api/outreach/sms/inbound", {
    method: "POST",
    body: JSON.stringify({
      providerMessageId: message.providerMessageId,
      from: message.from,
      to: message.to,
      body: message.body,
      receivedAt: message.receivedAt,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Inbound API ${response.status}: ${text.slice(0, 200)}`);
  }
  return (await response.json()) as {
    ok: boolean;
    isOptOut?: boolean;
    keyword?: string | null;
  };
}

export async function claimQueue(
  config: GatewayConfig,
): Promise<QueueMessage[]> {
  // LIVE: always request a single message; server also hard-caps to 1.
  const response = await apiFetch(
    config,
    `/api/outreach/sms/queue?limit=1`,
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Queue API ${response.status}: ${text.slice(0, 200)}`);
  }
  const data = (await response.json()) as { messages?: QueueMessage[] };
  return data.messages ?? [];
}

export function shouldDeleteAfterInbound(pushSucceeded: boolean): boolean {
  return pushSucceeded;
}

export async function processOutboundBatch(
  config: GatewayConfig,
  modem: SmsModem,
  options?: { random?: () => number },
): Promise<{ sent: number; failed: number; skipped: number }> {
  const status = await modem.getStatus();
  if (!status.connected && !config.dryRun) {
    console.warn(`[poller] Modem offline: ${status.detail}`);
    return { sent: 0, failed: 0, skipped: 0 };
  }

  let budget: BudgetSnapshot | null = null;
  try {
    budget = await fetchDailyBudget(config);
  } catch (error) {
    console.error(
      "[poller] budget fetch failed:",
      error instanceof Error ? error.message : error,
    );
    return { sent: 0, failed: 0, skipped: 0 };
  }

  if (!budget?.sendWindowOpen) {
    return { sent: 0, failed: 0, skipped: 0 };
  }
  if (budget.remaining <= 0 || budget.sent >= budget.target) {
    console.log(
      `[poller] daily target reached localDate=${budget.localDate} sent=${budget.sent} target=${budget.target}`,
    );
    return { sent: 0, failed: 0, skipped: 0 };
  }

  const messages = await claimQueue(config);
  if (messages.length === 0) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  // Hard policy: never process more than one claimed message per cycle.
  const message = messages[0]!;
  if (messages.length > 1) {
    console.warn(
      `[poller] claimed ${messages.length} messages; only sending the first (batch must be 1)`,
    );
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  const auth = await authorizeSend(config, message.messageId);
  if (!auth.send) {
    console.log(
      `[poller] skip message=${message.messageId} reason=${auth.reason ?? "blocked"}`,
    );
    skipped += 1;
    return { sent, failed, skipped };
  }

  const result = await modem.sendSms(message.to, message.text);
  if (result.success) {
    await reportResult(config, {
      messageId: message.messageId,
      success: true,
      providerMessageId: result.providerMessageId,
    });
    sent += 1;
    if (config.dryRun) {
      console.log(`[poller] dry-run send message=${message.messageId}`);
    }
    const delayMs = randomSendDelayMs(options?.random);
    console.log(`[poller] pacing sleepMs=${delayMs}`);
    await sleep(delayMs);
  } else {
    await reportResult(config, {
      messageId: message.messageId,
      success: false,
      error: result.error,
    });
    failed += 1;
  }

  return { sent, failed, skipped };
}

export async function processInboundBatch(
  config: GatewayConfig,
  modem: SmsModem,
): Promise<{ pushed: number; deleted: number }> {
  if (modem instanceof HiLinkModem) {
    await modem.getDeviceInformation();
  }
  const inbound = await modem.listIncomingSms();
  let pushed = 0;
  let deleted = 0;

  for (const message of inbound) {
    if (seenInbound.has(message.providerMessageId)) {
      continue;
    }
    try {
      const result = await pushInbound(config, message);
      seenInbound.add(message.providerMessageId);
      pushed += 1;
      console.log(
        `[poller] inbound sender=${maskPhone(message.from)} optOut=${Boolean(result.isOptOut)}${result.keyword ? ` keyword=${result.keyword}` : ""}`,
      );
      if (shouldDeleteAfterInbound(true) && message.modemMessageId) {
        const del = await modem.deleteSms(message.modemMessageId);
        if (del.success) {
          deleted += 1;
        } else {
          console.warn(
            `[poller] inbound delete failed id=${message.modemMessageId}: ${del.error}`,
          );
        }
      }
    } catch (error) {
      console.error(
        "[poller] inbound push failed; leaving SMS on modem:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return { pushed, deleted };
}

export async function processOneBatch(
  config: GatewayConfig,
  modem: SmsModem,
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  try {
    const outbound = await processOutboundBatch(config, modem);
    sent = outbound.sent;
    failed = outbound.failed;
    if (outbound.skipped) {
      console.log(`[poller] outbound skipped=${outbound.skipped}`);
    }
  } catch (error) {
    console.error(
      "[poller] outbound cycle error:",
      error instanceof Error ? error.message : error,
    );
  }

  try {
    await processInboundBatch(config, modem);
  } catch (error) {
    console.error(
      "[poller] inbound cycle error:",
      error instanceof Error ? error.message : error,
    );
  }

  return { sent, failed };
}

export async function runPollerLoop(): Promise<void> {
  const config = loadGatewayConfig();
  const { modem, status } = await detectModem({
    dryRun: config.dryRun,
    hilinkUrl: config.hilinkUrl,
  });

  console.log(
    `[poller] started mode=${status.mode} dryRun=${config.dryRun} api=${config.apiBaseUrl}`,
  );
  console.log(`[poller] modem: ${status.detail ?? status.mode}`);
  console.log(
    `[poller] LIVE pacing: claim=1 delay=${SMS_SEND_DELAY_MIN_MS}-${SMS_SEND_DELAY_MAX_MS}ms after success`,
  );

  let stopping = false;
  const stop = () => {
    stopping = true;
    console.log("[poller] shutting down…");
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  while (!stopping) {
    try {
      const result = await processOneBatch(config, modem);
      if (result.sent || result.failed) {
        console.log(
          `[poller] batch sent=${result.sent} failed=${result.failed}`,
        );
      }
    } catch (error) {
      console.error(
        "[poller] cycle error:",
        error instanceof Error ? error.message : error,
      );
    }
    await sleep(config.pollIntervalMs);
  }
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  void runPollerLoop();
}
