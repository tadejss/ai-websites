import type { EmailTemplateContext } from "../build-context";

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderFollowup2Email(ctx: EmailTemplateContext): RenderedEmail {
  const greeting = `Pozdravljeni${ctx.companyName ? ` pri ${ctx.companyName}` : ""},`;

  const text = [
    greeting,
    "",
    "Zadnji prijazen opomnik glede predloga spletne strani, ki sem ga pripravil za vas.",
    "",
    `Predogled: ${ctx.demoUrl}`,
    "",
    "Če vas zanima, odgovorite na to sporočilo. Če ne, vas ne bom več motil.",
    "",
    "Lep pozdrav",
  ].join("\n");

  const html = `
    <p>${escapeHtml(greeting)}</p>
    <p>Zadnji prijazen opomnik glede predloga spletne strani, ki sem ga pripravil za vas.</p>
    <p><a href="${escapeHtml(ctx.demoUrl)}">Odpri predogled spletne strani</a></p>
    <p>Če vas zanima, odgovorite na to sporočilo. Če ne, vas ne bom več motil.</p>
    <p>Lep pozdrav</p>
  `.trim();

  const subject = ctx.companyName
    ? `Zadnji opomnik: ${ctx.companyName}`
    : "Zadnji opomnik glede predloga spletne strani";

  return { subject, html, text };
}
