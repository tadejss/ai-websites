import nodemailer from "nodemailer";

export type ContactEmailInput = {
  to: string;
  businessName: string;
  name: string;
  phone: string;
  message: string;
};

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number.parseInt(process.env.SMTP_PORT?.trim() ?? "587", 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim();

  if (!host || !user || !pass || !from || !Number.isFinite(port)) {
    return null;
  }

  return { host, port, user, pass, from };
}

export async function sendContactEmail(
  input: ContactEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const smtp = getSmtpConfig();

  if (!smtp) {
    return {
      ok: false,
      error: "Storitev za pošiljanje e-pošte ni konfigurirana.",
    };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

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

  try {
    await transporter.sendMail({
      from: smtp.from,
      to: input.to,
      replyTo: undefined,
      subject,
      text,
    });

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Pošiljanje e-pošte ni uspelo";

    return { ok: false, error: message };
  }
}
