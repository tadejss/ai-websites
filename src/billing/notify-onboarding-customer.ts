import { Resend } from "resend";
import { getOnboardingUrl } from "@/onboarding/store";

export type OnboardingCustomerEmailInput = {
  slug: string;
  accessToken: string;
  companyName: string;
  contactEmail: string;
  contactName?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendOnboardingCustomerEmail(
  input: OnboardingCustomerEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }

  const to = input.contactEmail.trim();
  if (!to) {
    return { ok: false, error: "Missing customer email" };
  }

  const onboardingUrl = getOnboardingUrl(input.slug, input.accessToken);
  const greeting = input.contactName?.trim()
    ? `Pozdravljeni, ${input.contactName.trim()}`
    : "Pozdravljeni";

  const subject = "Izpolni podatke za svojo spletno stran";
  const text = [
    greeting,
    "",
    "Hvala za nakup na Zbrendiraj.si!",
    "",
    `Vaša demo stran za ${input.companyName} bomo po vaših podatkih prilagodili vašemu podjetju.`,
    "",
    "Izpolnite kratek vprašalnik (približno 5 minut):",
    onboardingUrl,
    "",
    "Ko bomo prejeli podatke, pripravimo končno različico strani in vas obvestimo pred objavo.",
    "",
    "Vprašanja: info@zbrendiraj.si",
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#18181b">
      <p style="font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#a3e635">Zbrendiraj.si</p>
      <h1 style="font-size:24px;font-weight:600;margin:16px 0 8px">${escapeHtml(subject)}</h1>
      <p style="color:#52525b;line-height:1.6">${escapeHtml(greeting)},</p>
      <p style="color:#52525b;line-height:1.6">Hvala za nakup! Vašo demo stran za <strong>${escapeHtml(input.companyName)}</strong> bomo po vaših podatkih prilagodili vašemu podjetju.</p>
      <p style="color:#52525b;line-height:1.6">Izpolnite kratek vprašalnik — traja približno 5 minut.</p>
      <p style="margin:28px 0">
        <a href="${escapeHtml(onboardingUrl)}" style="display:inline-block;background:#d9f99d;color:#09090b;padding:12px 24px;border-radius:9999px;font-weight:600;text-decoration:none">Izpolni podatke za svojo stran</a>
      </p>
      <p style="color:#71717a;font-size:14px;line-height:1.6">Ko bomo prejeli podatke, pripravimo končno različico strani in vas obvestimo pred objavo.</p>
      <p style="color:#71717a;font-size:14px">Vprašanja: <a href="mailto:info@zbrendiraj.si">info@zbrendiraj.si</a></p>
    </div>
  `.trim();

  const resend = new Resend(apiKey);

  try {
    const response = await resend.emails.send({
      from: "Zbrendiraj.si <noreply@zbrendiraj.si>",
      to,
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
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Pošiljanje e-pošte ni uspelo",
    };
  }
}
