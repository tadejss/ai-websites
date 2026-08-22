import { Resend } from "resend";
import { getDemoUrl } from "@/leads/demo-url";
import type { LeadRecord } from "@/leads/store";
import { planLabel, type CheckoutPlan } from "./stripe";

export type CheckoutNotifyInput = {
  lead: LeadRecord;
  plan: CheckoutPlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  sessionId?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendCheckoutNotification(
  input: CheckoutNotifyInput,
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
  const demoUrl = getDemoUrl(input.lead);
  const plan = planLabel(input.plan);

  const subject = `Nova naročnina – ${companyName} (${plan})`;
  const text = [
    "Nova Stripe naročnina na Zbrendiraj.si",
    "",
    `Podjetje: ${companyName}`,
    `Slug: ${input.lead.slug}`,
    `Plan: ${plan}`,
    `Demo: ${demoUrl}`,
    `Stripe customer: ${input.stripeCustomerId ?? "-"}`,
    `Stripe subscription: ${input.stripeSubscriptionId ?? "-"}`,
    `Checkout session: ${input.sessionId ?? "-"}`,
    `Telefon: ${input.lead.phone ?? "-"}`,
    `Email (lead): ${input.lead.email ?? "-"}`,
  ].join("\n");

  const html = [
    `<p><strong>Nova Stripe naročnina</strong></p>`,
    `<p><strong>Podjetje:</strong> ${escapeHtml(companyName)}<br />`,
    `<strong>Slug:</strong> ${escapeHtml(input.lead.slug)}<br />`,
    `<strong>Plan:</strong> ${escapeHtml(plan)}<br />`,
    `<strong>Demo:</strong> <a href="${escapeHtml(demoUrl)}">${escapeHtml(demoUrl)}</a><br />`,
    `<strong>Stripe customer:</strong> ${escapeHtml(input.stripeCustomerId ?? "-")}<br />`,
    `<strong>Stripe subscription:</strong> ${escapeHtml(input.stripeSubscriptionId ?? "-")}<br />`,
    `<strong>Session:</strong> ${escapeHtml(input.sessionId ?? "-")}<br />`,
    `<strong>Telefon:</strong> ${escapeHtml(input.lead.phone ?? "-")}<br />`,
    `<strong>Email (lead):</strong> ${escapeHtml(input.lead.email ?? "-")}</p>`,
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
