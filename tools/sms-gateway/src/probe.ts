import { loadGatewayConfig } from "./config";
import { HiLinkModem } from "./modem/hilink";
import { maskPresent } from "./modem/xml";

type ProbeLine = {
  label: string;
  value: string;
};

function line(label: string, value: string): ProbeLine {
  return { label, value };
}

function format(lines: ProbeLine[]): string {
  const width = Math.max(...lines.map((item) => item.label.length), 18);
  return lines
    .map((item) => `${item.label.padEnd(width)}  ${item.value}`)
    .join("\n");
}

async function probeRoot(url: string): Promise<{
  reachable: boolean;
  status: number | null;
  detail: string;
}> {
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
    });
    return {
      reachable: true,
      status: response.status,
      detail: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      reachable: false,
      status: null,
      detail: error instanceof Error ? error.message : "unreachable",
    };
  }
}

async function probeProductionHealth(
  apiBaseUrl: string,
  gatewaySecret: string,
): Promise<{ reachable: boolean; auth: string }> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/outreach/sms/health`, {
      headers: { Authorization: `Bearer ${gatewaySecret}` },
      signal: AbortSignal.timeout(15000),
    });
    if (response.status === 401) {
      return { reachable: true, auth: "FAILED" };
    }
    if (response.ok) {
      return { reachable: true, auth: "OK" };
    }
    return { reachable: true, auth: `HTTP ${response.status}` };
  } catch {
    return { reachable: false, auth: "UNREACHABLE" };
  }
}

async function main(): Promise<void> {
  let config;
  try {
    config = loadGatewayConfig();
  } catch (error) {
    console.error(
      "Config failure:",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
    return;
  }

  console.log("SMS Gateway Probe");
  console.log("=================\n");
  console.log("Config");
  console.log("------");
  console.log(
    format([
      line("HiLink URL", config.hilinkUrl),
      line("Dry-run", config.dryRun ? "YES" : "NO"),
      line("SMS daily limit", String(config.dailyLimit)),
      line("Poll interval", `${config.pollIntervalMs}ms`),
    ]),
  );

  const root = await probeRoot(config.hilinkUrl);
  const modem = new HiLinkModem(config.hilinkUrl);

  let session = "FAILED";
  let sesTok = "absent";
  if (root.reachable) {
    const ses = await modem.probeGet("/api/webserver/SesTokInfo");
    if (ses.ok) {
      session = "OK";
      sesTok = "TokInfo/SesInfo present";
    } else {
      session = ses.detail;
    }
  }

  const candidates = root.reachable
    ? await Promise.all([
        modem.probeGet("/api/user/state-login"),
        modem.probeGet("/api/device/information"),
        modem.probeGet("/api/pin/status"),
        modem.probeGet("/api/monitoring/status"),
      ])
    : [];

  const device = root.reachable ? await modem.getDeviceInformation() : null;
  const sim = root.reachable ? await modem.getSimStatus() : "UNKNOWN";
  const monitoring = root.reachable ? await modem.getStatus() : null;
  const smsList = root.reachable
    ? await modem.peekSmsList()
    : { ok: false, count: 0, detail: "modem unreachable" };

  const loginHint = candidates.find((item) => item.path.includes("state-login"));
  let authRequired = "UNKNOWN";
  if (session === "OK" && (monitoring?.connected || smsList.ok)) {
    authRequired = "NO (session-only; APIs work without login POST)";
  } else if (loginHint?.ok) {
    authRequired = "CHECK state-login (APIs not yet usable)";
  } else if (session === "OK") {
    authRequired = "NO / NOT YET REQUIRED";
  }

  const health = await probeProductionHealth(
    config.apiBaseUrl,
    config.gatewaySecret,
  );

  console.log("\nNetwork / Modem");
  console.log("---------------");
  console.log(
    format([
      line("HiLink reachable", root.reachable ? "YES" : "NO"),
      line("Session", session),
      line("SesTokInfo", sesTok),
      line("Model", device?.model ?? "UNKNOWN"),
      line("Firmware", device?.softwareVersion ?? "UNKNOWN"),
      line("Web UI", device?.webuiVersion ?? "UNKNOWN"),
    ]),
  );

  console.log("\nAuthentication");
  console.log("--------------");
  console.log(
    format([
      line("Auth required", authRequired),
      line("Authentication", session === "OK" ? "OK / NOT REQUIRED" : "FAILED"),
      line("TokInfo", maskPresent(session === "OK" ? "x".repeat(8) : null)),
    ]),
  );

  console.log("\nSIM");
  console.log("---");
  console.log(
    format([
      line("SIM", sim),
      line(
        "Registration",
        monitoring?.networkType
          ? "see signal"
          : sim === "NO_SIM"
            ? "NOT_REGISTERED"
            : "UNKNOWN",
      ),
    ]),
  );

  console.log("\nSignal");
  console.log("------");
  console.log(
    format([
      line("Signal", monitoring?.signal ?? "unavailable"),
      line("Network", monitoring?.networkType ?? "unavailable"),
    ]),
  );

  console.log("\nSMS API");
  console.log("-------");
  console.log(
    format([
      line("SMS list", smsList.ok ? "AVAILABLE" : "UNAVAILABLE"),
      line("SMS delete", "NOT PROBED (write)"),
      line("SMS send", "NOT PROBED (write)"),
    ]),
  );

  console.log("\nDiscovery endpoints");
  console.log("-------------------");
  if (!root.reachable) {
    console.log("skipped (modem unreachable)");
  } else {
    for (const item of candidates) {
      console.log(
        `${item.path}: HTTP ${item.status ?? "—"} ${item.ok ? "OK" : "FAIL"} ${item.errorCode ? `code=${item.errorCode}` : ""} tags=${item.tags.join(",") || "—"}`,
      );
    }
  }

  console.log("\nProduction API");
  console.log("--------------");
  console.log(
    format([
      line("API reachable", health.reachable ? "YES" : "NO"),
      line("Gateway auth", health.auth),
      line("Queue endpoint", "NOT PROBED (would claim)"),
    ]),
  );

  console.log("\nMode");
  console.log("----");
  console.log(format([line("SMS_DRY_RUN", config.dryRun ? "TRUE" : "FALSE")]));

  const configOk = Boolean(config.gatewaySecret && config.localSecret);
  const modemOk = root.reachable && session === "OK";
  const noSimOk = modemOk && (sim === "NO_SIM" || sim === "UNKNOWN" || sim === "READY");
  if (!configOk || health.auth === "FAILED") {
    process.exitCode = 1;
    return;
  }
  if (!root.reachable) {
    process.exitCode = 1;
    return;
  }
  process.exitCode = modemOk || noSimOk ? 0 : 1;
}

void main();
