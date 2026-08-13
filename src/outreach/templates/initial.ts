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

function locationPhrase(ctx: EmailTemplateContext): string {
  if (ctx.city) {
    return ` v ${ctx.city}`;
  }

  return "";
}

function webPresenceLine(ctx: EmailTemplateContext): string {
  if (ctx.hasExistingWebsite) {
    return "Opazil sem, da bi vaša spletna prisotnost lahko bila močnejša in bolj pregledna za nove stranke.";
  }

  return "Opazil sem, da trenutno nimate ustrezne spletne strani, ki bi potencialnim strankam hitro pokazala, kdo ste in kaj ponujate.";
}

export function renderInitialEmail(ctx: EmailTemplateContext): RenderedEmail {
  const greeting = `Pozdravljeni${ctx.companyName ? ` pri ${ctx.companyName}` : ""},`;
  const industryPart = ctx.industry ? ` (${ctx.industry.toLowerCase()})` : "";

  const text = [
    greeting,
    "",
    `Nedavno sem naletel na vaše podjetje${locationPhrase(ctx)}${industryPart}.`,
    webPresenceLine(ctx),
    "",
    "Zato sem pripravil kratek koncept spletne strani, prilagojen vašemu poslovanju. Brez obveznosti – samo da vidite, kako bi lahko izgledalo.",
    "",
    `Predogled: ${ctx.demoUrl}`,
    "",
    "Če vam je všeč, z veseljem povem več. Če ni pravi trenutek, brez skrbi.",
    "",
    "Lep pozdrav",
  ].join("\n");

  const html = `
    <p>${escapeHtml(greeting)}</p>
    <p>Nedavno sem naletel na vaše podjetje${escapeHtml(locationPhrase(ctx))}${escapeHtml(industryPart)}.</p>
    <p>${escapeHtml(webPresenceLine(ctx))}</p>
    <p>Zato sem pripravil kratek koncept spletne strani, prilagojen vašemu poslovanju. Brez obveznosti – samo da vidite, kako bi lahko izgledalo.</p>
    <p><a href="${escapeHtml(ctx.demoUrl)}">Odpri predogled spletne strani</a></p>
    <p>Če vam je všeč, z veseljem povem več. Če ni pravi trenutek, brez skrbi.</p>
    <p>Lep pozdrav</p>
  `.trim();

  const subject = ctx.companyName
    ? `${ctx.companyName} – pripravil sem vam predlog spletne strani`
    : "Pripravil sem vam predlog spletne strani";

  return { subject, html, text };
}
