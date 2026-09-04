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

const seenInbound = new Set<string>();

type DayCounter = {
  dayKey: string;
  sent: number;
};

const dayCounter: DayCounter = {
  dayKey: "",
  sent: 0,
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function recordSuccessfulSend(config: GatewayConfig): void {
  const key = todayKey();
  if (dayCounter.dayKey !== key) {
    dayCounter.dayKey = key;
    dayCounter.sent = 0;
  }
  dayCounter.sent += 1;
  if (dayCounter.sent >= config.dailyLimit) {
    console.warn(
      `[poller] Local daily send counter reached ${config.dailyLimit}`,
    );
  }
}

function remainingDailySends(config: GatewayConfig): number {
  const key = todayKey();
  if (dayCounter.dayKey !== key) {
    dayCounter.dayKey = key;
    dayCounter.sent = 0;
  }
  return Math.max(0, config.dailyLimit - dayCounter.sent);
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
  const response = await apiFetch(
    config,
    `/api/outreach/sms/queue?limit=${config.batchSize}`,
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
): Promise<{ sent: number; failed: number; skipped: number }> {
  const status = await modem.getStatus();
  if (!status.connected && !config.dryRun) {
    console.warn(`[poller] Modem offline: ${status.detail}`);
    return { sent: 0, failed: 0, skipped: 0 };
  }

  const messages = await claimQueue(config);
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let remaining = remainingDailySends(config);

  for (const message of messages) {
    if (remaining <= 0) {
      console.warn(
        `[poller] Daily limit ${config.dailyLimit} reached; not sending further claimed messages this cycle (lease will expire for reclaim)`,
      );
      break;
    }

    const auth = await authorizeSend(config, message.messageId);
    if (!auth.send) {
      console.log(
        `[poller] skip message=${message.messageId} reason=${auth.reason ?? "blocked"}`,
      );
      skipped += 1;
      continue;
    }

    const result = await modem.sendSms(message.to, message.text);
    if (result.success) {
      await reportResult(config, {
        messageId: message.messageId,
        success: true,
        providerMessageId: result.providerMessageId,
      });
      sent += 1;
      remaining -= 1;
      recordSuccessfulSend(config);
      if (config.dryRun) {
        console.log(`[poller] dry-run send message=${message.messageId}`);
      }
    } else {
      await reportResult(config, {
        messageId: message.messageId,
        success: false,
        error: result.error,
      });
      failed += 1;
    }
    await sleep(config.minDelayMs);
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
