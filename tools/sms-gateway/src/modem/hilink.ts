import { HilinkError } from "./errors";
import type {
  DeleteSmsResult,
  IncomingSms,
  ModemStatus,
  SendSmsResult,
  SmsModem,
} from "./types";
import {
  mapSimStatus,
  parseDeviceInfo,
  parseMonitoring,
  parseSmsList,
  parseTokenHeader,
  xmlErrorCode,
  xmlText,
  type DeviceInfo,
  type SimStatus,
} from "./xml";

const GET_TIMEOUT_MS = 8000;
const POST_TIMEOUT_MS = 20000;
const AUTH_ERROR_CODES = new Set(["100003", "125002", "125003"]);

type SessionTokens = {
  cookie: string;
  token: string;
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatHiLinkDate(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function headerValue(headers: Headers, name: string): string | null {
  return headers.get(name) ?? headers.get(name.toLowerCase());
}

export class HiLinkModem implements SmsModem {
  private cookie = "";
  private tokens: string[] = [];
  private deviceNs = "unknown";
  private sessionLogged = false;

  constructor(private readonly baseUrl: string) {}

  getDeviceNamespace(): string {
    return this.deviceNs;
  }

  private ingestResponseTokens(response: Response, xml?: string): void {
    const rotated = parseTokenHeader(
      headerValue(response.headers, "__RequestVerificationToken"),
    );
    if (rotated.length > 0) {
      this.tokens = rotated;
    }
    const setCookie = headerValue(response.headers, "set-cookie");
    if (setCookie) {
      this.cookie = setCookie.split(";")[0] ?? this.cookie;
    }
    if (xml) {
      const ses = xmlText(xml, "SesInfo");
      const tok = xmlText(xml, "TokInfo");
      if (ses) {
        this.cookie = ses;
      }
      if (tok) {
        this.tokens = [tok, ...this.tokens.filter((item) => item !== tok)];
      }
    }
  }

  private takeToken(): string {
    return this.tokens.shift() ?? "";
  }

  private async fetchSession(): Promise<SessionTokens> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/webserver/SesTokInfo`, {
        headers: { Accept: "*/*" },
        signal: AbortSignal.timeout(GET_TIMEOUT_MS),
      });
    } catch (error) {
      throw new HilinkError(
        "MODEM_UNREACHABLE",
        error instanceof Error ? error.message : "HiLink unreachable",
      );
    }

    const xml = await response.text();
    this.ingestResponseTokens(response, xml);
    const cookie =
      this.cookie ||
      xmlText(xml, "SesInfo") ||
      headerValue(response.headers, "set-cookie")?.split(";")[0] ||
      "";
    const token = this.takeToken() || xmlText(xml, "TokInfo") || "";
    if (!cookie || !token) {
      throw new HilinkError(
        "SESSION_FAILED",
        "HiLink session tokens missing from SesTokInfo",
      );
    }
    this.cookie = cookie;
    if (!this.sessionLogged) {
      console.log("[hilink] session established");
      this.sessionLogged = true;
    }
    return { cookie, token };
  }

  private async request(input: {
    path: string;
    method?: "GET" | "POST";
    body?: string;
    timeoutMs?: number;
    allowRetry?: boolean;
  }): Promise<{ response: Response; xml: string }> {
    const session = this.cookie && this.tokens.length > 0
      ? { cookie: this.cookie, token: this.takeToken() }
      : await this.fetchSession();

    const method = input.method ?? "GET";
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${input.path}`, {
        method,
        headers: {
          Cookie: session.cookie,
          __RequestVerificationToken: session.token,
          "X-Requested-With": "XMLHttpRequest",
          Accept: "*/*",
          ...(method === "POST"
            ? {
                "Content-Type":
                  "application/x-www-form-urlencoded; charset=UTF-8",
                Origin: this.baseUrl,
              }
            : {}),
        },
        body: input.body,
        signal: AbortSignal.timeout(input.timeoutMs ?? GET_TIMEOUT_MS),
      });
    } catch (error) {
      throw new HilinkError(
        "MODEM_UNREACHABLE",
        error instanceof Error ? error.message : "HiLink unreachable",
      );
    }

    const xml = await response.text();
    this.ingestResponseTokens(response, xml);

    const errorCode = xmlErrorCode(xml);
    if (errorCode && AUTH_ERROR_CODES.has(errorCode)) {
      if (input.allowRetry !== false) {
        this.cookie = "";
        this.tokens = [];
        return this.request({ ...input, allowRetry: false });
      }
      throw new HilinkError(
        errorCode === "100003" ? "AUTH_REQUIRED" : "TOKEN_EXPIRED",
        `HiLink auth/session error code ${errorCode}`,
      );
    }

    return { response, xml };
  }

  async probeGet(path: string): Promise<{
    path: string;
    ok: boolean;
    status: number | null;
    contentType: string | null;
    errorCode: string | null;
    tags: string[];
    detail: string;
  }> {
    try {
      const { response, xml } = await this.request({
        path,
        method: "GET",
        allowRetry: path !== "/api/webserver/SesTokInfo",
      });
      const errorCode = xmlErrorCode(xml);
      return {
        path,
        ok: response.ok && !errorCode,
        status: response.status,
        contentType: response.headers.get("content-type"),
        errorCode,
        tags: (xml.match(/<([A-Za-z][A-Za-z0-9_]*)>/g) ?? [])
          .map((tag) => tag.slice(1, -1))
          .filter((tag, index, all) => all.indexOf(tag) === index)
          .slice(0, 16),
        detail: errorCode ? `error ${errorCode}` : "ok",
      };
    } catch (error) {
      return {
        path,
        ok: false,
        status: null,
        contentType: null,
        errorCode: null,
        tags: [],
        detail: error instanceof Error ? error.message : "request failed",
      };
    }
  }

  async getDeviceInformation(): Promise<DeviceInfo | null> {
    try {
      const { xml } = await this.request({
        path: "/api/device/information",
      });
      const info = parseDeviceInfo(xml);
      this.deviceNs = info.deviceNs;
      return info;
    } catch {
      return null;
    }
  }

  async getSimStatus(): Promise<SimStatus> {
    try {
      const { xml } = await this.request({ path: "/api/pin/status" });
      const status = mapSimStatus(xml);
      console.log(`[hilink] SIM status: ${status}`);
      return status;
    } catch (error) {
      if (error instanceof HilinkError && error.code === "MODEM_UNREACHABLE") {
        return "UNKNOWN";
      }
      return "UNKNOWN";
    }
  }

  async getStatus(): Promise<ModemStatus> {
    try {
      const { response, xml } = await this.request({
        path: "/api/monitoring/status",
      });
      const monitoring = parseMonitoring(xml);
      return {
        connected: response.ok && !xmlErrorCode(xml),
        mode: "hilink",
        hilinkUrl: this.baseUrl,
        signal: monitoring.signal,
        networkType: monitoring.networkType,
        detail: response.ok ? "HiLink reachable" : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        connected: false,
        mode: "disconnected",
        hilinkUrl: this.baseUrl,
        detail:
          error instanceof Error ? error.message : "HiLink unreachable",
      };
    }
  }

  async sendSms(to: string, message: string): Promise<SendSmsResult> {
    try {
      const body =
        `<?xml version='1.0' encoding='UTF-8'?>` +
        `<request>` +
        `<Index>-1</Index>` +
        `<Phones><Phone>${escapeXml(to)}</Phone></Phones>` +
        `<Sca></Sca>` +
        `<Content>${escapeXml(message)}</Content>` +
        `<Length>${message.length}</Length>` +
        `<Reserved>1</Reserved>` +
        `<Date>${formatHiLinkDate()}</Date>` +
        `</request>`;

      const { response, xml } = await this.request({
        path: "/api/sms/send-sms",
        method: "POST",
        body,
        timeoutMs: POST_TIMEOUT_MS,
        allowRetry: false,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HiLink send-sms HTTP ${response.status}: ${xml.slice(0, 200)}`,
        };
      }

      const errorCode = xmlErrorCode(xml);
      if (errorCode) {
        return { success: false, error: `HiLink SMS error code ${errorCode}` };
      }

      const ok = xmlText(xml, "response") ?? xml;
      const providerMessageId = `hilink-${Date.now()}-${to.replace(/\D/g, "").slice(-6)}`;
      if (ok.toLowerCase().includes("ok") || response.ok) {
        return { success: true, providerMessageId };
      }

      return {
        success: false,
        error: `Unexpected HiLink response: ${xml.slice(0, 200)}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "HiLink send failed",
      };
    }
  }

  async listIncomingSms(): Promise<IncomingSms[]> {
    try {
      const body =
        `<?xml version="1.0" encoding="UTF-8"?>` +
        `<request>` +
        `<PageIndex>1</PageIndex>` +
        `<ReadCount>20</ReadCount>` +
        `<BoxType>1</BoxType>` +
        `<SortType>0</SortType>` +
        `<Ascending>0</Ascending>` +
        `<UnreadPreferred>0</UnreadPreferred>` +
        `</request>`;

      const { response, xml } = await this.request({
        path: "/api/sms/sms-list",
        method: "POST",
        body,
        timeoutMs: 15000,
      });

      if (!response.ok || xmlErrorCode(xml)) {
        return [];
      }

      return parseSmsList(xml, this.deviceNs);
    } catch {
      return [];
    }
  }

  async deleteSms(id: string): Promise<DeleteSmsResult> {
    try {
      const body =
        `<?xml version="1.0" encoding="UTF-8"?>` +
        `<request><Index>${escapeXml(id)}</Index></request>`;
      const { response, xml } = await this.request({
        path: "/api/sms/delete-sms",
        method: "POST",
        body,
        timeoutMs: 15000,
        allowRetry: false,
      });
      if (!response.ok || xmlErrorCode(xml)) {
        return {
          success: false,
          error: `HiLink delete-sms failed: ${xmlErrorCode(xml) ?? response.status}`,
        };
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "HiLink delete failed",
      };
    }
  }

  async peekSmsList(): Promise<{ ok: boolean; count: number; detail: string }> {
    try {
      const messages = await this.listIncomingSms();
      return {
        ok: true,
        count: messages.length,
        detail: `available (${messages.length} messages)`,
      };
    } catch (error) {
      return {
        ok: false,
        count: 0,
        detail: error instanceof Error ? error.message : "unavailable",
      };
    }
  }
}
