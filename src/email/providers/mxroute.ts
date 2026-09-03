import type {
  EmailDnsRecord,
  EmailProvider,
  ProviderDomain,
  ProviderMailbox,
} from "./types";

type MxrouteResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string };
};

type MxrouteDnsInfo = {
  mx_records?: Array<{
    priority?: number;
    hostname?: string;
    description?: string;
  }>;
  spf?: { type?: string; name?: string; value?: string } | null;
  dkim?: { type?: string; name?: string; value?: string } | null;
  verification?: { type?: string; name?: string; value?: string } | null;
};

type MxrouteEmailAccount = {
  username?: string;
  email?: string;
  quota?: number;
  suspended?: boolean;
};

function requireMxrouteConfig() {
  const server = process.env.MXROUTE_SERVER?.trim();
  const username = process.env.MXROUTE_USERNAME?.trim();
  const apiKey = process.env.MXROUTE_API_KEY?.trim();

  if (!server || !username || !apiKey) {
    throw new Error(
      "MXROUTE_SERVER, MXROUTE_USERNAME, and MXROUTE_API_KEY are required",
    );
  }

  return { server, username, apiKey };
}

function dnsNameToRecordName(domain: string, name: string | undefined): string {
  if (!name || name === "@" || name === domain) {
    return domain;
  }
  if (name.endsWith(`.${domain}`)) {
    return name;
  }
  if (name.includes(".")) {
    return name;
  }
  return `${name}.${domain}`;
}

export class MxrouteProvider implements EmailProvider {
  readonly name = "mxroute" as const;

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const { server, username, apiKey } = requireMxrouteConfig();
    const url = `https://api.mxroute.com${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Server": server,
        "X-Username": username,
        "X-API-Key": apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const payload = (await response.json()) as MxrouteResponse<T>;

    if (!response.ok || payload.success === false) {
      const code = payload.error?.code ?? `HTTP_${response.status}`;
      const message = payload.error?.message ?? response.statusText;
      throw new Error(`MXroute ${code}: ${message}`);
    }

    return payload.data as T;
  }

  async getDomain(domain: string): Promise<ProviderDomain | null> {
    try {
      await this.request<{ domain?: string }>("GET", `/domains/${encodeURIComponent(domain)}`);
      const verified = await this.isDomainVerified(domain);
      return { domain, verified };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("NOT_FOUND")) {
        return null;
      }
      throw error;
    }
  }

  async createDomain(domain: string): Promise<ProviderDomain> {
    try {
      await this.request("POST", "/domains", { domain });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("CONFLICT")) {
        throw error;
      }
    }

    const existing = await this.getDomain(domain);
    if (!existing) {
      throw new Error(`MXroute domain missing after create: ${domain}`);
    }
    return existing;
  }

  async getMailbox(
    domain: string,
    localPart: string,
  ): Promise<ProviderMailbox | null> {
    try {
      const account = await this.request<MxrouteEmailAccount>(
        "GET",
        `/domains/${encodeURIComponent(domain)}/email-accounts/${encodeURIComponent(localPart)}`,
      );
      return {
        id: account.username ?? localPart,
        localPart: account.username ?? localPart,
        emailAddress: account.email ?? `${localPart}@${domain}`,
        quotaMb: account.quota ?? null,
        suspended: Boolean(account.suspended),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("NOT_FOUND")) {
        return null;
      }
      throw error;
    }
  }

  async createMailbox(input: {
    domain: string;
    localPart: string;
    password: string;
    quotaMb?: number;
  }): Promise<ProviderMailbox> {
    const body: Record<string, unknown> = {
      username: input.localPart,
      password: input.password,
    };
    if (input.quotaMb != null) {
      body.quota = input.quotaMb;
    }

    try {
      await this.request("POST", `/domains/${encodeURIComponent(input.domain)}/email-accounts`, body);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("CONFLICT")) {
        throw error;
      }
    }

    const mailbox = await this.getMailbox(input.domain, input.localPart);
    if (!mailbox) {
      throw new Error(
        `MXroute mailbox missing after create: ${input.localPart}@${input.domain}`,
      );
    }
    return mailbox;
  }

  async suspendMailbox(domain: string, localPart: string): Promise<void> {
    await this.request(
      "PATCH",
      `/domains/${encodeURIComponent(domain)}/mail-status`,
      { enabled: false },
    );
    void localPart;
  }

  async unsuspendMailbox(domain: string, localPart: string): Promise<void> {
    await this.request(
      "PATCH",
      `/domains/${encodeURIComponent(domain)}/mail-status`,
      { enabled: true },
    );
    void localPart;
  }

  async deleteMailbox(domain: string, localPart: string): Promise<void> {
    await this.request(
      "DELETE",
      `/domains/${encodeURIComponent(domain)}/email-accounts/${encodeURIComponent(localPart)}`,
    );
  }

  async resetMailboxPassword(
    domain: string,
    localPart: string,
    password: string,
  ): Promise<void> {
    await this.request(
      "PATCH",
      `/domains/${encodeURIComponent(domain)}/email-accounts/${encodeURIComponent(localPart)}`,
      { password },
    );
  }

  async getDnsRecords(domain: string): Promise<EmailDnsRecord[]> {
    const dns = await this.request<MxrouteDnsInfo>(
      "GET",
      `/domains/${encodeURIComponent(domain)}/dns`,
    );

    const records: EmailDnsRecord[] = [];

    for (const mx of dns.mx_records ?? []) {
      if (!mx.hostname) continue;
      records.push({
        type: "MX",
        name: domain,
        content: mx.hostname.endsWith(".") ? mx.hostname : `${mx.hostname}.`,
        priority: mx.priority ?? 10,
      });
    }

    if (dns.spf?.value) {
      records.push({
        type: "TXT",
        name: dnsNameToRecordName(domain, dns.spf.name),
        content: dns.spf.value,
      });
    }

    if (dns.dkim?.value && dns.dkim.name) {
      records.push({
        type: "TXT",
        name: dnsNameToRecordName(domain, dns.dkim.name),
        content: dns.dkim.value,
      });
    }

    if (dns.verification?.value && dns.verification.name) {
      records.push({
        type: "TXT",
        name: dnsNameToRecordName(domain, dns.verification.name),
        content: dns.verification.value,
      });
    }

    const dmarcName = `_dmarc.${domain}`;
    records.push({
      type: "TXT",
      name: dmarcName,
      content: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
    });

    return records;
  }

  async isDomainVerified(domain: string): Promise<boolean> {
    const dns = await this.request<MxrouteDnsInfo>(
      "GET",
      `/domains/${encodeURIComponent(domain)}/dns`,
    );
    return !dns.verification?.value;
  }
}
