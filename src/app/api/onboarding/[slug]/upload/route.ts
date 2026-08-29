import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { verifyOnboardingAccess } from "@/onboarding/auth";
import { isBlobStorageConfigured } from "@/images/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;

  if (!isBlobStorageConfigured()) {
    return NextResponse.json(
      { error: "Upload storage is not configured" },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const token =
    (typeof formData.get("token") === "string"
      ? formData.get("token")?.toString().trim()
      : null) ||
    new URL(request.url).searchParams.get("token")?.trim() ||
    null;

  const access = await verifyOnboardingAccess(slug, token);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }

  const kind =
    typeof formData.get("kind") === "string" ? formData.get("kind") : "asset";
  const safeKind = kind === "logo" ? "logo" : "photo";
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const pathname = `onboarding/${slug}/${safeKind}-${Date.now()}.${ext}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await put(pathname, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
      allowOverwrite: true,
      ...(process.env.BLOB_READ_WRITE_TOKEN?.trim()
        ? { token: process.env.BLOB_READ_WRITE_TOKEN.trim() }
        : {}),
    });

    return NextResponse.json({ ok: true, url: result.url, kind: safeKind });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("[onboarding/upload]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
