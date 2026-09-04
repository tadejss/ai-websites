type VercelDomainPayload = {
  name?: string;
  verified?: boolean;
  error?: { code?: string; message?: string };
  message?: string;
};

export type VercelProjectDomain = {
  name: string;
  verified: boolean;
};

export class VercelDomainConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VercelDomainConfigError";
  }
}

export class VercelDomainRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VercelDomainRequestError";
  }
}

function vercelToken(): string | null {
  return (
    process.env.VERCEL_TOKEN?.trim() ||
    process.env.VERCEL_ACCESS_TOKEN?.trim() ||
    null
  );
}

function vercelProjectId(): string | null {
  return process.env.VERCEL_PROJECT_ID?.trim() || null;
}

function vercelTeamId(): string | null {
  return (
    process.env.VERCEL_TEAM_ID?.trim() ||
    process.env.VERCEL_ORG_ID?.trim() ||
    null
  );
}

export function isVercelDomainConfigured(): boolean {
  return Boolean(vercelToken() && vercelProjectId());
}

function requireVercelConfig(): { token: string; projectId: string; teamId: string | null } {
  const token = vercelToken();
  const projectId = vercelProjectId();
  if (!token || !projectId) {
    throw new VercelDomainConfigError(
      "Vercel is not configured for custom domains.",
    );
  }
  return { token, projectId, teamId: vercelTeamId() };
}

function vercelUrl(path: string, teamId: string | null): string {
  const url = new URL(`https://api.vercel.com${path}`);
  if (teamId) {
    url.searchParams.set("teamId", teamId);
  }
  return url.toString();
}

function adminSafeVercelMessage(status: number, payload: VercelDomainPayload): string {
  const code = payload.error?.code ?? "";
  if (code === "forbidden" || status === 403) {
    return "Vercel rejected the domain request.";
  }
  if (code === "domain_already_in_use") {
    return "This domain is already used on another Vercel project.";
  }
  return "Could not add the domain on Vercel.";
}

function parseDomain(payload: VercelDomainPayload, fallbackName: string): VercelProjectDomain {
  return {
    name: payload.name ?? fallbackName,
    verified: payload.verified === true,
  };
}

async function vercelFetch(
  path: string,
  init: RequestInit,
): Promise<{ status: number; payload: VercelDomainPayload }> {
  const { token, teamId } = requireVercelConfig();
  const response = await fetch(vercelUrl(path, teamId), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  let payload: VercelDomainPayload = {};
  try {
    payload = (await response.json()) as VercelDomainPayload;
  } catch {
    payload = {};
  }

  return { status: response.status, payload };
}

export async function getVercelProjectDomain(
  hostname: string,
): Promise<VercelProjectDomain | null> {
  const { projectId } = requireVercelConfig();
  const { status, payload } = await vercelFetch(
    `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(hostname)}`,
    { method: "GET" },
  );

  if (status === 404) {
    return null;
  }
  if (status >= 400) {
    throw new VercelDomainRequestError(adminSafeVercelMessage(status, payload));
  }
  return parseDomain(payload, hostname);
}

export async function verifyVercelProjectDomain(
  hostname: string,
): Promise<VercelProjectDomain> {
  const { projectId } = requireVercelConfig();
  const { status, payload } = await vercelFetch(
    `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(hostname)}/verify`,
    { method: "POST" },
  );

  if (status >= 400) {
    const existing = await getVercelProjectDomain(hostname);
    if (existing) {
      return existing;
    }
    throw new VercelDomainRequestError(adminSafeVercelMessage(status, payload));
  }
  return parseDomain(payload, hostname);
}

/**
 * Add domain to the project. Already-on-project is not fatal — reconcile via GET.
 */
export async function ensureVercelProjectDomain(
  hostname: string,
): Promise<VercelProjectDomain> {
  const { projectId } = requireVercelConfig();
  const { status, payload } = await vercelFetch(
    `/v10/projects/${encodeURIComponent(projectId)}/domains`,
    {
      method: "POST",
      body: JSON.stringify({ name: hostname }),
    },
  );

  if (status < 400) {
    return parseDomain(payload, hostname);
  }

  const existing = await getVercelProjectDomain(hostname);
  if (existing) {
    return existing;
  }

  throw new VercelDomainRequestError(adminSafeVercelMessage(status, payload));
}

export async function addAndVerifyVercelDomain(
  hostname: string,
): Promise<VercelProjectDomain> {
  const added = await ensureVercelProjectDomain(hostname);
  if (added.verified) {
    return added;
  }
  return verifyVercelProjectDomain(hostname);
}
