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

export function renderFollowup1Email(ctx: EmailTemplateContext): RenderedEmail {
  const greeting = `Pozdravljeni${ctx.companyName ? ` pri ${ctx.companyName}` : ""},`;

  const text = [
    greeting,
    "",
    "Samo kratek opomnik na sporočilo iz prejšnjega tedna – pripravil sem vam predogled spletne strani.",
    "",
    `Predogled: ${ctx.demoUrl}`,
    "",
    "Če želite, mi lahko odgovorite na to sporočilo ali pokličete. Če trenutno ni pravi čas, razumem.",
    "",
    "Lep pozdrav",
  ].join("\n");

  const html = `
    <p>${escapeHtml(greeting)}</p>
    <p>Samo kratek opomnik na sporočilo iz prejšnjega tedna – pripravil sem vam predogled spletne strani.</p>
    <p><a href="${escapeHtml(ctx.demoUrl)}">Odpri predogled spletne strani</a></p>
    <p>Če želite, mi lahko odgovorite na to sporočilo ali pokličete. Če trenutno ni pravi čas, razumem.</p>
    <p>Lep pozdrav</p>
  `.trim();

  const subject = ctx.companyName
    ? `Opomnik: predlog spletne strani za ${ctx.companyName}`
    : "Opomnik: predlog spletne strani";

  return { subject, html, text };
}
