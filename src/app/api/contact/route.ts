import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactEmail } from "@/contact/send-email";
import { getSiteConfig } from "@/content/get-site-config";
import { resolveClientIp, hashRateLimitMaterial } from "@/lib/client-ip";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1).max(200),
  phone: z.string().min(1).max(50),
  message: z.string().min(1).max(5000),
});

export async function POST(request: Request) {
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

  const ip = resolveClientIp(request.headers);
  const rateKey = await hashRateLimitMaterial(
    `contact:${ip}:${parsed.data.slug}`,
  );
  const limited = await checkRateLimit({
    key: rateKey,
    limit: 5,
    windowMs: 60_000,
  });
  if (!limited.allowed) {
    return rateLimitResponse(
      limited,
      "Preveč zahtevkov. Poskusite znova čez minuto.",
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
    return NextResponse.json({ error: "Pošiljanje ni uspelo." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
