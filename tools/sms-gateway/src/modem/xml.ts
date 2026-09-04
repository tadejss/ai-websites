import { createHash } from "node:crypto";
import type { IncomingSms } from "./types";

export type SimStatus =
  | "NO_SIM"
  | "PIN_REQUIRED"
  | "READY"
  | "PIN_BLOCKED"
  | "NETWORK_UNAVAILABLE"
  | "UNKNOWN";

export type DeviceInfo = {
  model: string | null;
  softwareVersion: string | null;
  webuiVersion: string | null;
  deviceNs: string;
};

export function decodeXmlEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 10)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

export function xmlText(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match?.[1]) {
    return null;
  }
  return decodeXmlEntities(match[1].trim());
}

export function xmlErrorCode(xml: string): string | null {
  if (!/<error>/i.test(xml)) {
    return null;
  }
  return xmlText(xml, "code");
}

export function parseTokenHeader(header: string | null | undefined): string[] {
  if (!header?.trim()) {
    return [];
  }
  return header
    .split("#")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function maskPresent(value: string | null | undefined): string {
  if (!value) {
    return "absent";
  }
  return `present (length=${value.length})`;
}

export function mapSimStatus(xml: string): SimStatus {
  const simState = (xmlText(xml, "SimState") ?? xmlText(xml, "SimStatus") ?? "")
    .toLowerCase();
  const pinState = (
    xmlText(xml, "PinState") ??
    xmlText(xml, "PinStatus") ??
    xmlText(xml, "SimPinOptState") ??
    ""
  ).toLowerCase();
  const raw = xml.toLowerCase();

  if (
    simState === "0" ||
    simState === "255" ||
    simState.includes("nosim") ||
    raw.includes("<simstate>0</simstate>") ||
    /no[_\s-]?sim/i.test(xml)
  ) {
    return "NO_SIM";
  }

  if (
    pinState === "2" ||
    pinState.includes("puk") ||
    simState.includes("puk") ||
    /pin[_\s-]?blocked/i.test(xml)
  ) {
    return "PIN_BLOCKED";
  }

  if (
    pinState === "1" ||
    simState === "2" ||
    /pin[_\s-]?required/i.test(xml) ||
    simState.includes("pin")
  ) {
    return "PIN_REQUIRED";
  }

  if (simState === "1" || simState === "ready" || pinState === "0") {
    return "READY";
  }

  return "UNKNOWN";
}

export function parseDeviceInfo(xml: string): DeviceInfo {
  const model =
    xmlText(xml, "DeviceName") ??
    xmlText(xml, "devicename") ??
    xmlText(xml, "ProductFamily") ??
    null;
  const softwareVersion =
    xmlText(xml, "SoftwareVersion") ?? xmlText(xml, "softwareversion") ?? null;
  const webuiVersion =
    xmlText(xml, "WebUIVersion") ?? xmlText(xml, "webuiVersion") ?? null;
  const nsSource = [model, softwareVersion].filter(Boolean).join(":");
  const deviceNs = nsSource
    ? createHash("sha256").update(nsSource).digest("hex").slice(0, 12)
    : "unknown";
  return { model, softwareVersion, webuiVersion, deviceNs };
}

export function buildInboundDedupeKey(input: {
  deviceNs: string;
  index: string | null;
  from: string;
  receivedAt: string | null;
  body: string;
}): string {
  if (input.index && input.from && input.receivedAt) {
    return `hilink:${input.deviceNs}:${input.index}:${input.from}:${input.receivedAt}`;
  }
  const fallback = createHash("sha256")
    .update(`${input.from}|${input.receivedAt ?? ""}|${input.body}`)
    .digest("hex")
    .slice(0, 24);
  return `hilink:${input.deviceNs}:hash:${fallback}`;
}

export function parseSmsList(xml: string, deviceNs: string): IncomingSms[] {
  const messages: IncomingSms[] = [];
  const blocks = xml.match(/<Message>[\s\S]*?<\/Message>/gi) ?? [];
  for (const block of blocks) {
    const index = xmlText(block, "Index");
    const phone = xmlText(block, "Phone");
    const content = xmlText(block, "Content");
    const date = xmlText(block, "Date");
    if (!phone || !content) {
      continue;
    }
    const receivedAt = date
      ? new Date(date.replace(" ", "T")).toISOString()
      : new Date().toISOString();
    messages.push({
      providerMessageId: buildInboundDedupeKey({
        deviceNs,
        index,
        from: phone,
        receivedAt: date,
        body: content,
      }),
      modemMessageId: index ?? undefined,
      from: phone,
      body: content,
      receivedAt,
    });
  }
  return messages;
}

export function parseMonitoring(xml: string): {
  signal: string | null;
  networkType: string | null;
  registered: boolean | null;
} {
  const connection = xmlText(xml, "ConnectionStatus");
  const signal = xmlText(xml, "SignalIcon");
  const networkType = xmlText(xml, "CurrentNetworkType");
  let registered: boolean | null = null;
  if (connection === "901" || connection === "2") {
    registered = true;
  } else if (connection === "900" || connection === "0" || connection === "1") {
    registered = false;
  }
  return { signal, networkType, registered };
}

export function xmlTagsPresent(xml: string): string[] {
  const tags = xml.match(/<([A-Za-z][A-Za-z0-9_]*)>/g) ?? [];
  return [...new Set(tags.map((tag) => tag.slice(1, -1)))].slice(0, 24);
}
