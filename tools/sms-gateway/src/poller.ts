import { pathToFileURL } from "node:url";
import { loadGatewayConfig, type GatewayConfig } from "./config";
import { detectModem } from "./modem/detect";
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

export async function pushInbound(
  config: GatewayConfig,
  message: IncomingSms,
): Promise<void> {
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

export async function processOneBatch(
  config: GatewayConfig,
  modem: SmsModem,
): Promise<{ sent: number; failed: number }> {
  const status = await modem.getStatus();
  if (!status.connected && !config.dryRun) {
    console.warn(`[poller] Modem offline: ${status.detail}`);
    return { sent: 0, failed: 0 };
  }

  const messages = await claimQueue(config);
  let sent = 0;
  let failed = 0;
  let remaining = remainingDailySends(config);

  for (const message of messages) {
    if (remaining <= 0) {
      console.warn(
        `[poller] Daily limit ${config.dailyLimit} reached; not sending further claimed messages this cycle (lease will expire for reclaim)`,
      );
      break;
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

  const inbound = await modem.listIncomingSms();
  for (const message of inbound) {
    if (seenInbound.has(message.providerMessageId)) {
      continue;
    }
    await pushInbound(config, message);
    seenInbound.add(message.providerMessageId);
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
