import { Resend } from "resend";

export type ContactEmailInput = {
  to: string;
  businessName: string;
  name: string;
  phone: string;
  message: string;
};

function buildEmailBody(input: ContactEmailInput): { subject: string; text: string; html: string } {
  const subject = `Novo povpraševanje – ${input.businessName}`;
  const text = [
    `Novo sporočilo s spletne strani ${input.businessName}`,
    "",
    `Ime: ${input.name}`,
    `Telefon: ${input.phone}`,
    "",
    "Sporočilo:",
    input.message,
  ].join("\n");

  const html = [
    `<p>Novo sporočilo s spletne strani <strong>${escapeHtml(input.businessName)}</strong></p>`,
    `<p><strong>Ime:</strong> ${escapeHtml(input.name)}<br />`,
    `<strong>Telefon:</strong> ${escapeHtml(input.phone)}</p>`,
    `<p><strong>Sporočilo:</strong></p>`,
    `<p>${escapeHtml(input.message).replace(/\n/g, "<br />")}</p>`,
  ].join("");

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendContactEmail(
  input: ContactEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return {
      ok: false,
      error: "Storitev za pošiljanje e-pošte ni konfigurirana.",
    };
  }

  const from = "Zbrendiraj.si <noreply@zbrendiraj.si>";
  const { subject, text, html } = buildEmailBody(input);
  const resend = new Resend(apiKey);

  try {
    const response = await resend.emails.send({
      from,
      to: input.to,
      subject,
      text,
      html,
    });

    if (response.error) {
      return {
        ok: false,
        error: response.error.message || "Pošiljanje e-pošte ni uspelo",
      };
    }

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Pošiljanje e-pošte ni uspelo";

    return { ok: false, error: message };
  }
}
