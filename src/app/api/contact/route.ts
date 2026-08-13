import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactEmail } from "@/contact/smtp";
import { getSiteConfig } from "@/content/get-site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1).max(200),
  phone: z.string().min(1).max(50),
  message: z.string().min(1).max(5000),
});

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count += 1;
  return false;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Preveč zahtevkov. Poskusite znova čez minuto." },
      { status: 429 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neveljavna zahteva." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Prosimo, izpolnite vsa obvezna polja." },
      { status: 400 },
    );
  }

  let siteConfig;

  try {
    siteConfig = getSiteConfig(parsed.data.slug);
  } catch {
    return NextResponse.json({ error: "Stran ni najdena." }, { status: 404 });
  }

  if (!siteConfig.privacy.contactForm.enabled) {
    return NextResponse.json(
      { error: "Kontaktni obrazec ni omogočen." },
      { status: 403 },
    );
  }

  const recipient = siteConfig.business.email?.trim();

  if (!recipient) {
    return NextResponse.json(
      { error: "Kontaktni e-naslov podjetja ni nastavljen." },
      { status: 503 },
    );
  }

  const result = await sendContactEmail({
    to: recipient,
    businessName: siteConfig.business.name,
    name: parsed.data.name,
    phone: parsed.data.phone,
    message: parsed.data.message,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
