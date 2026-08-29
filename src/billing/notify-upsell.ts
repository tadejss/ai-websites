import { Resend } from "resend";
import type { UpsellType } from "@/billing/upsells";
import { getUpsellDefinition } from "@/billing/upsells";
import type { LeadRecord } from "@/leads/store";

export type UpsellNotifyInput = {
  lead: LeadRecord;
  upsellType: UpsellType;
  sessionId?: string;
  originalCheckoutSessionId?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendUpsellNotification(
  input: UpsellNotifyInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to =
    process.env.CHECKOUT_NOTIFY_EMAIL?.trim() || "info@zbrendiraj.si";

  if (!apiKey) {
    return {
      ok: false,
      error: "RESEND_API_KEY is not configured",
    };
  }

  const companyName = input.lead.companyName?.trim() || input.lead.slug;
  const upsellLabel = getUpsellDefinition(input.upsellType).title;

  const subject = `Upsell – ${companyName}: ${upsellLabel}`;
  const text = [
    "Nov upsell nakup na Zbrendiraj.si",
    "",
    `Podjetje: ${companyName}`,
    `Slug: ${input.lead.slug}`,
    `Upsell: ${upsellLabel} (${input.upsellType})`,
    `Checkout session: ${input.sessionId ?? "-"}`,
    `Original session: ${input.originalCheckoutSessionId ?? "-"}`,
  ].join("\n");

  const html = [
    `<p><strong>Nov upsell nakup</strong></p>`,
    `<p><strong>Podjetje:</strong> ${escapeHtml(companyName)}<br />`,
    `<strong>Slug:</strong> ${escapeHtml(input.lead.slug)}<br />`,
    `<strong>Upsell:</strong> ${escapeHtml(upsellLabel)} (${escapeHtml(input.upsellType)})<br />`,
    `<strong>Session:</strong> ${escapeHtml(input.sessionId ?? "-")}<br />`,
    `<strong>Original session:</strong> ${escapeHtml(input.originalCheckoutSessionId ?? "-")}</p>`,
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
    const message =
      error instanceof Error ? error.message : "Pošiljanje e-pošte ni uspelo";

    return { ok: false, error: message };
  }
}
