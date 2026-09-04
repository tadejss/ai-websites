export const WEBSITE_DOMAIN_STATUSES = ["pending", "live", "failed"] as const;
export type WebsiteDomainStatus = (typeof WEBSITE_DOMAIN_STATUSES)[number];

export const WEBSITE_DOMAIN_KINDS = ["apex", "www"] as const;
export type WebsiteDomainKind = (typeof WEBSITE_DOMAIN_KINDS)[number];

export function isWebsiteDomainStatus(
  value: string,
): value is WebsiteDomainStatus {
  return (WEBSITE_DOMAIN_STATUSES as readonly string[]).includes(value);
}

export function isWebsiteDomainKind(value: string): value is WebsiteDomainKind {
  return (WEBSITE_DOMAIN_KINDS as readonly string[]).includes(value);
}

export type WebsiteDomainRecord = {
  id: number;
  customerSlug: string;
  hostname: string;
  kind: WebsiteDomainKind;
  status: WebsiteDomainStatus;
  canonical: boolean;
  vercelVerified: boolean;
  vercelError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WebsiteHostPair = {
  apex: string;
  www: string;
};

export class WebsiteDomainCollisionError extends Error {
  readonly hostname: string;

  constructor(hostname: string) {
    super("This domain is already connected to another customer.");
    this.name = "WebsiteDomainCollisionError";
    this.hostname = hostname;
  }
}

export class WebsiteDomainValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebsiteDomainValidationError";
  }
}
