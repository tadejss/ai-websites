import { Resend } from "resend";
import { getDemoUrl } from "@/leads/demo-url";
import { toAbsoluteUrl } from "@/site-url";

export type OnboardingPublishApprovedEmailInput = {
  slug: string;
  companyName: string;
  contactEmail?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendOnboardingPublishApprovedEmail(
  input: OnboardingPublishApprovedEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to =
    process.env.CHECKOUT_NOTIFY_EMAIL?.trim() || "info@zbrendiraj.si";

  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }

  const adminUrl = toAbsoluteUrl(`/admin/leads/${input.slug}`);
  const demoUrl = getDemoUrl({ slug: input.slug, url: `/${input.slug}` });

  const subject = "Spletna stran potrjena — pripravljena za objavo";
  const text = [
    subject,
    "",
    `Podjetje: ${input.companyName}`,
    `Slug: ${input.slug}`,
    `Kontaktni email: ${input.contactEmail ?? "—"}`,
    "",
    `Demo: ${demoUrl}`,
    `Admin: ${adminUrl}`,
  ].join("\n");

  const html = [
    `<p><strong>${escapeHtml(subject)}</strong></p>`,
    `<p><strong>Podjetje:</strong> ${escapeHtml(input.companyName)}<br />`,
    `<strong>Slug:</strong> ${escapeHtml(input.slug)}<br />`,
    `<strong>Kontaktni email:</strong> ${escapeHtml(input.contactEmail ?? "—")}</p>`,
    `<p><a href="${escapeHtml(demoUrl)}">Odpri demo stran</a><br />`,
    `<a href="${escapeHtml(adminUrl)}">Odpri admin stran</a></p>`,
  ].join("");

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
