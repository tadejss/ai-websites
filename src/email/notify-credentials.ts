import { Resend } from "resend";
import { getWebmailUrl } from "./providers";

export async function sendMailboxCredentialsEmail(input: {
  contactEmail: string;
  contactName?: string | null;
  emailAddress: string;
  password: string;
  webmailUrl?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }

  const to = input.contactEmail.trim();
  if (!to) {
    return { ok: false, error: "Missing customer email" };
  }

  const webmailUrl = input.webmailUrl ?? getWebmailUrl();
  const greeting = input.contactName?.trim()
    ? `Pozdravljeni, ${input.contactName.trim()}`
    : "Pozdravljeni";

  const subject = "Vaš poslovni e-naslov je pripravljen";
  const text = [
    greeting,
    "",
    "Vaš poslovni e-naslov je aktiven:",
    input.emailAddress,
    "",
    "Začasno geslo (spremenite ga ob prvi prijavi):",
    input.password,
    "",
    webmailUrl ? `Webmail: ${webmailUrl}` : "",
    "",
    "Ekipa Zbrendiraj",
  ]
    .filter(Boolean)
    .join("\n");

  const resend = new Resend(apiKey);
  const from =
    process.env.OUTREACH_FROM_EMAIL?.trim() || "Zbrendiraj <info@zbrendiraj.si>";

  try {
    await resend.emails.send({
      from,
      to,
      subject,
      text,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    return { ok: false, error: message };
  }
}
