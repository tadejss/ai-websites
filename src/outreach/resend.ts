import { Resend } from "resend";
import { formatFromAddress, getOutreachConfig } from "./config";
import { logOutreach } from "./logger";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: Array<{ name: string; value: string }>;
};

export type SendEmailResult =
  | { ok: true; messageId: string; dryRun: boolean }
  | { ok: false; error: string; retryable: boolean };

function isRetryableError(message: string, statusCode?: number): boolean {
  if (statusCode === 429) {
    return true;
  }

  const lower = message.toLowerCase();

  return (
    lower.includes("rate limit") ||
    lower.includes("timeout") ||
    lower.includes("temporarily") ||
    lower.includes("network")
  );
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const config = getOutreachConfig();

  if (config.dryRun) {
    logOutreach({
      level: "info",
      event: "dry_run_send",
      recipient: input.to,
      subject: input.subject,
      dryRun: true,
      details: {
        textPreview: input.text.slice(0, 500),
      },
    });

    return {
      ok: true,
      messageId: `dry_run_${Date.now()}`,
      dryRun: true,
    };
  }

  if (!config.resendApiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured", retryable: false };
  }

  const from = formatFromAddress(config);

  if (!from) {
    return {
      ok: false,
      error: "OUTREACH_FROM_EMAIL is not configured",
      retryable: false,
    };
  }

  const resend = new Resend(config.resendApiKey);
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await resend.emails.send({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        tags: input.tags,
      });

      if (response.error) {
        const message = response.error.message || "Resend API error";
        const retryable = isRetryableError(message);

        if (retryable && attempt < maxAttempts) {
          await sleep(attempt * 1000);
          continue;
        }

        return { ok: false, error: message, retryable };
      }

      const messageId = response.data?.id;

      if (!messageId) {
        return {
          ok: false,
          error: "Resend returned no message ID",
          retryable: false,
        };
      }

      return { ok: true, messageId, dryRun: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown send error";
      const retryable = isRetryableError(message);

      if (retryable && attempt < maxAttempts) {
        await sleep(attempt * 1000);
        continue;
      }

      return { ok: false, error: message, retryable };
    }
  }

  return { ok: false, error: "Failed to send email", retryable: true };
}
