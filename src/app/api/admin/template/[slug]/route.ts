import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { isTemplateId, type TemplateId } from "@/templates/types";
import { validateSiteConfig } from "@/content/validate-site-config";
import type { SiteConfig } from "@/content/types/site";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sitePath(slug: string): string {
  return resolve(process.cwd(), "src/content/clients", slug, "site.json");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  try {
    const raw = JSON.parse(readFileSync(sitePath(slug), "utf8")) as SiteConfig;
    return NextResponse.json({
      slug,
      templateId: raw.templateId ?? null,
      appearance: raw.appearance ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  let body: { templateId?: string };

  try {
    body = (await request.json()) as { templateId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isTemplateId(body.templateId)) {
    return NextResponse.json(
      { error: "templateId must be bento | outlined | type | floating" },
      { status: 400 },
    );
  }

  const templateId: TemplateId = body.templateId;

  try {
    const path = sitePath(slug);
    const raw = JSON.parse(readFileSync(path, "utf8")) as SiteConfig;
    const next = validateSiteConfig({ ...raw, templateId });
    writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    revalidatePath(`/${slug}`);
    return NextResponse.json({ ok: true, slug, templateId });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update",
      },
      { status: 500 },
    );
  }
}
