import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { verifyOnboardingAccess } from "@/onboarding/auth";
import { isBlobStorageConfigured } from "@/images/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

type RouteContext = {
  params: Promise<{ slug: string }>;
};

type UploadedImageResult = {
  url: string;
  fileName: string;
  kind: "logo" | "photo";
};

function readKind(formData: FormData): "logo" | "photo" {
  const kind = formData.get("kind");
  return kind === "logo" ? "logo" : "photo";
}

function collectFiles(formData: FormData): File[] {
  const files: File[] = [];

  for (const entry of formData.getAll("files")) {
    if (entry instanceof File && entry.size > 0) {
      files.push(entry);
    }
  }

  if (files.length === 0) {
    const single = formData.get("file");
    if (single instanceof File && single.size > 0) {
      files.push(single);
    }
  }

  return files;
}

async function uploadOne(
  slug: string,
  file: File,
  kind: "logo" | "photo",
): Promise<UploadedImageResult> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.name}`);
  }

  if (file.size > MAX_BYTES) {
    throw new Error(`File too large (max 5 MB): ${file.name}`);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const pathname = `onboarding/${slug}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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

  return {
    url: result.url,
    fileName: file.name,
    kind,
  };
}

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

  const files = collectFiles(formData);
  if (files.length === 0) {
    return NextResponse.json({ error: "Missing file(s)" }, { status: 400 });
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files (max ${MAX_FILES})` },
      { status: 400 },
    );
  }

  const kind = readKind(formData);
  const uploaded: UploadedImageResult[] = [];
  const errors: { fileName: string; error: string }[] = [];

  for (const file of files) {
    try {
      uploaded.push(await uploadOne(slug, file, kind));
    } catch (error) {
      errors.push({
        fileName: file.name,
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  }

  if (uploaded.length === 0) {
    return NextResponse.json(
      {
        error: errors[0]?.error ?? "Upload failed",
        errors,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    images: uploaded,
    url: uploaded[0]?.url,
    kind,
    errors: errors.length ? errors : undefined,
  });
}
