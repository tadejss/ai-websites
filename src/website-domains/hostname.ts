import { normalizeDomain } from "@/email/normalize-domain";
import {
  WebsiteDomainValidationError,
  type WebsiteHostPair,
} from "./types";

const BLOCKED_APEX_HOSTS = new Set([
  "zbrendiraj.si",
  "splet.vercel.app",
  "vercel.app",
  "localhost",
]);

const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Host header → hostname. Does not strip www (apex and www are distinct). */
export function normalizeHostHeader(hostHeader: string | null | undefined): string {
  if (!hostHeader?.trim()) {
    return "";
  }
  return hostHeader.split(":")[0]?.trim().toLowerCase() ?? "";
}

export function isBlockedWebsiteApex(apex: string): boolean {
  if (BLOCKED_APEX_HOSTS.has(apex)) {
    return true;
  }
  if (apex.endsWith(".vercel.app") || apex.endsWith(".vercel.sh")) {
    return true;
  }
  return false;
}

function isIpv4(value: string): boolean {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value);
}

function hasValidLabels(hostname: string): boolean {
  if (hostname.length > 253 || hostname.includes("_") || hostname.includes(" ")) {
    return false;
  }
  const labels = hostname.split(".");
  if (labels.length < 2) {
    return false;
  }
  const tld = labels[labels.length - 1] ?? "";
  if (tld.length < 2 || !/^[a-z]{2,63}$/.test(tld)) {
    return false;
  }
  return labels.every((label) => LABEL_RE.test(label));
}

/**
 * Admin/customer input → apex + www pair.
 * `www.example.si` and `example.si` produce the same pair.
 */
export function parseWebsiteHostPair(
  input: string,
): WebsiteHostPair {
  const apex = normalizeDomain(input);
  if (!apex) {
    throw new WebsiteDomainValidationError("Enter a valid domain, e.g. example.si.");
  }
  if (isIpv4(apex) || apex.includes(":")) {
    throw new WebsiteDomainValidationError("IP addresses are not allowed.");
  }
  if (isBlockedWebsiteApex(apex)) {
    throw new WebsiteDomainValidationError(
      "This host cannot be used as a customer domain.",
    );
  }
  if (!hasValidLabels(apex)) {
    throw new WebsiteDomainValidationError("Enter a valid domain, e.g. example.si.");
  }

  return {
    apex,
    www: `www.${apex}`,
  };
}
