import type { EmailProvider, EmailProviderName } from "./types";
import { MxrouteProvider } from "./mxroute";

export function getEmailProviderName(): EmailProviderName {
  const raw = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (raw === "mxroute" || !raw) {
    return "mxroute";
  }
  throw new Error(`Unsupported EMAIL_PROVIDER: ${raw}`);
}

export function getEmailProvider(): EmailProvider {
  const name = getEmailProviderName();
  if (name === "mxroute") {
    return new MxrouteProvider();
  }
  throw new Error(`Unsupported EMAIL_PROVIDER: ${name}`);
}

export function isEmailProviderConfigured(): boolean {
  return Boolean(
    process.env.MXROUTE_SERVER?.trim() &&
      process.env.MXROUTE_USERNAME?.trim() &&
      process.env.MXROUTE_API_KEY?.trim(),
  );
}

export function getWebmailUrl(): string | null {
  return process.env.MXROUTE_WEBMAIL_URL?.trim() || null;
}
