import type { EmailDnsRecord } from "@/email/providers/types";

export type CloudflareDnsUpsertResult = {
  zoneId: string;
  created: number;
  updated: number;
  unchanged: number;
};

type CloudflareRecord = {
  id: string;
  type: string;
  name: string;
  content: string;
  priority?: number;
  ttl?: number;
};

type CloudflareListResponse = {
  success: boolean;
  result?: CloudflareRecord[];
  errors?: Array<{ message?: string }>;
};

type CloudflareSingleResponse = {
  success: boolean;
  result?: CloudflareRecord;
  errors?: Array<{ message?: string }>;
};

function requireCloudflareToken(): string {
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!token) {
    throw new Error("CLOUDFLARE_API_TOKEN is required for email DNS");
  }
  return token;
}

async function cfRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = requireCloudflareToken();
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as T & {
    success?: boolean;
    errors?: Array<{ message?: string }>;
  };

  if (!response.ok || payload.success === false) {
    const message =
      payload.errors?.map((error) => error.message).filter(Boolean).join("; ") ||
      response.statusText;
    throw new Error(`Cloudflare API error: ${message}`);
  }

  return payload;
}

function normalizeRecordName(name: string, zoneName: string): string {
  if (name === "@" || name === zoneName) {
    return zoneName;
  }
  if (name.endsWith(`.${zoneName}`)) {
    return name;
  }
  return `${name}.${zoneName}`;
}

function recordsMatch(
  existing: CloudflareRecord,
  desired: EmailDnsRecord,
  zoneName: string,
): boolean {
  const desiredName = normalizeRecordName(desired.name, zoneName);
  if (existing.type !== desired.type) return false;
  if (existing.name !== desiredName) return false;

  if (desired.type === "MX") {
    return (
      existing.content === desired.content &&
      (existing.priority ?? 0) === (desired.priority ?? 0)
    );
  }

  return existing.content === desired.content;
}

function mergeSpf(existingContent: string, desiredContent: string): string {
  if (!existingContent.includes("v=spf1")) {
    return desiredContent;
  }
  if (existingContent.includes("include:mxroute.com")) {
    return existingContent;
  }
  return existingContent.replace(
    /(~all|-all|\?all|\+all)\s*$/,
    " include:mxroute.com $1",
  );
}

export async function findCloudflareZoneId(domain: string): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const query = new URLSearchParams({ name: domain, status: "active" });
  if (accountId) {
    query.set("account.id", accountId);
  }

  const payload = await cfRequest<{
    result?: Array<{ id: string; name: string }>;
  }>(`/zones?${query.toString()}`);

  const zone = payload.result?.find(
    (entry) => entry.name.toLowerCase() === domain.toLowerCase(),
  );

  if (!zone) {
    throw new Error(`Cloudflare zone not found for domain: ${domain}`);
  }

  return zone.id;
}

export async function upsertEmailDnsRecords(input: {
  zoneId: string;
  zoneName: string;
  records: EmailDnsRecord[];
}): Promise<CloudflareDnsUpsertResult> {
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const desired of input.records) {
    const desiredName = normalizeRecordName(desired.name, input.zoneName);
    const list = await cfRequest<CloudflareListResponse>(
      `/zones/${input.zoneId}/dns_records?type=${encodeURIComponent(desired.type)}&name=${encodeURIComponent(desiredName)}`,
    );

    const existingRecords = list.result ?? [];
    let content = desired.content;

    if (desired.type === "TXT" && desired.content.includes("v=spf1")) {
      const spfExisting = existingRecords.find(
        (record) => record.type === "TXT" && record.content.includes("v=spf1"),
      );
      if (spfExisting) {
        content = mergeSpf(spfExisting.content, desired.content);
      }
    }

    const match = existingRecords.find((record) =>
      recordsMatch(record, { ...desired, content }, input.zoneName),
    );

    if (match) {
      unchanged += 1;
      continue;
    }

    const sameName = existingRecords[0];
    const body = {
      type: desired.type,
      name: desiredName,
      content,
      ttl: desired.ttl ?? 3600,
      ...(desired.type === "MX" ? { priority: desired.priority ?? 10 } : {}),
    };

    if (sameName) {
      await cfRequest<CloudflareSingleResponse>(
        `/zones/${input.zoneId}/dns_records/${sameName.id}`,
        { method: "PUT", body: JSON.stringify(body) },
      );
      updated += 1;
    } else {
      await cfRequest<CloudflareSingleResponse>(
        `/zones/${input.zoneId}/dns_records`,
        { method: "POST", body: JSON.stringify(body) },
      );
      created += 1;
    }
  }

  return {
    zoneId: input.zoneId,
    created,
    updated,
    unchanged,
  };
}
