import type {
  IncomingSms,
  ModemStatus,
  SendSmsResult,
  SmsModem,
} from "./types";

type SessionTokens = {
  cookie: string;
  token: string;
};

function xmlText(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1]?.trim() ?? null;
}

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

export class HiLinkModem implements SmsModem {
  constructor(private readonly baseUrl: string) {}

  private async fetchSession(): Promise<SessionTokens> {
    const response = await fetch(`${this.baseUrl}/api/webserver/SesTokInfo`, {
      headers: { Accept: "*/*" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      throw new Error(`SesTokInfo HTTP ${response.status}`);
    }
    const xml = await response.text();
    const cookie =
      xmlText(xml, "SesInfo") ||
      response.headers.get("set-cookie")?.split(";")[0] ||
      "";
    const token = xmlText(xml, "TokInfo") || "";
    if (!cookie || !token) {
      throw new Error("HiLink session tokens missing from SesTokInfo");
    }
    return { cookie, token };
  }

  private async withSession<T>(
    fn: (session: SessionTokens) => Promise<T>,
  ): Promise<T> {
    const session = await this.fetchSession();
    return fn(session);
  }

  async getStatus(): Promise<ModemStatus> {
    try {
      return await this.withSession(async (session) => {
        const response = await fetch(
          `${this.baseUrl}/api/monitoring/status`,
          {
            headers: {
              Cookie: session.cookie,
              __RequestVerificationToken: session.token,
              "X-Requested-With": "XMLHttpRequest",
            },
            signal: AbortSignal.timeout(8000),
          },
        );
        const xml = await response.text();
        return {
          connected: response.ok,
          mode: "hilink",
          hilinkUrl: this.baseUrl,
          signal: xmlText(xml, "SignalIcon"),
          networkType: xmlText(xml, "CurrentNetworkType"),
          detail: response.ok ? "HiLink reachable" : `HTTP ${response.status}`,
        };
      });
    } catch (error) {
      return {
        connected: false,
        mode: "disconnected",
        hilinkUrl: this.baseUrl,
        detail: error instanceof Error ? error.message : "HiLink unreachable",
      };
    }
  }

  async sendSms(to: string, message: string): Promise<SendSmsResult> {
    try {
      return await this.withSession(async (session) => {
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

        const response = await fetch(`${this.baseUrl}/api/sms/send-sms`, {
          method: "POST",
          headers: {
            Cookie: session.cookie,
            __RequestVerificationToken: session.token,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            Accept: "*/*",
            Origin: this.baseUrl,
            Referer: `${this.baseUrl}/html/smsinbox.html`,
          },
          body,
          signal: AbortSignal.timeout(20000),
        });

        const xml = await response.text();
        if (!response.ok) {
          return {
            success: false,
            error: `HiLink send-sms HTTP ${response.status}: ${xml.slice(0, 200)}`,
          };
        }

        if (/<error>/i.test(xml)) {
          const code = xmlText(xml, "code") ?? "unknown";
          return { success: false, error: `HiLink SMS error code ${code}` };
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
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "HiLink send failed",
      };
    }
  }

  async listIncomingSms(): Promise<IncomingSms[]> {
    try {
      return await this.withSession(async (session) => {
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

        const response = await fetch(`${this.baseUrl}/api/sms/sms-list`, {
          method: "POST",
          headers: {
            Cookie: session.cookie,
            __RequestVerificationToken: session.token,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
          },
          body,
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          return [];
        }

        const xml = await response.text();
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
          messages.push({
            providerMessageId: `hilink-in-${index ?? `${phone}-${date}`}`,
            from: phone,
            body: content,
            receivedAt: date
              ? new Date(date.replace(" ", "T")).toISOString()
              : new Date().toISOString(),
          });
        }
        return messages;
      });
    } catch {
      return [];
    }
  }
}
