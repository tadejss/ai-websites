import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

export type StoredImageUrls = {
  /** Primary CDN/local URL (AVIF). */
  src: string;
  /** WebP fallback URL. */
  srcFallback: string;
  storage: "vercel-blob" | "local";
};

function blobStoreId(): string | undefined {
  return process.env.BLOB_STORE_ID?.trim() || undefined;
}

function blobOidcToken(): string | undefined {
  return process.env.VERCEL_OIDC_TOKEN?.trim() || undefined;
}

function blobReadWriteToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
}

/** Running inside a Vercel deployment (Functions / builds). */
function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

/**
 * Prefer OIDC on Vercel; use the static RW token for local/CI generation
 * (outside Vercel), per Vercel Blob auth docs.
 */
export function isBlobStorageConfigured(): boolean {
  if (isVercelRuntime()) {
    return Boolean(blobStoreId() && blobOidcToken()) || Boolean(blobReadWriteToken());
  }
  return Boolean(blobReadWriteToken()) || Boolean(blobStoreId() && blobOidcToken());
}

async function putBlob(
  pathname: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const baseOptions = {
    access: "public" as const,
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  };

  // On Vercel: let the SDK use OIDC (BLOB_STORE_ID + VERCEL_OIDC_TOKEN).
  if (isVercelRuntime() && blobStoreId() && blobOidcToken()) {
    const result = await put(pathname, body, baseOptions);
    return result.url;
  }

  // Local / CI / non-Vercel hosts: static RW token.
  // OIDC takes precedence in the SDK when both are set, so temporarily
  // clear OIDC env for this call when using the RW token.
  const rwToken = blobReadWriteToken();
  if (rwToken) {
    const previousOidc = process.env.VERCEL_OIDC_TOKEN;
    const previousStoreId = process.env.BLOB_STORE_ID;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.BLOB_STORE_ID;
    try {
      const result = await put(pathname, body, {
        ...baseOptions,
        token: rwToken,
      });
      return result.url;
    } finally {
      if (previousOidc !== undefined) {
        process.env.VERCEL_OIDC_TOKEN = previousOidc;
      }
      if (previousStoreId !== undefined) {
        process.env.BLOB_STORE_ID = previousStoreId;
      }
    }
  }

  // Last resort: OIDC outside Vercel (e.g. after vercel env pull with Development linked).
  if (blobStoreId() && blobOidcToken()) {
    const result = await put(pathname, body, baseOptions);
    return result.url;
  }

  throw new Error(
    "Vercel Blob is not configured (need BLOB_READ_WRITE_TOKEN locally, or OIDC on Vercel)",
  );
}

async function writeLocal(
  relativePath: string,
  body: Buffer,
): Promise<string> {
  const absolute = path.join(process.cwd(), "public", relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, body);
  return `/${relativePath.replace(/\\/g, "/")}`;
}

/**
 * Persist optimized AVIF + WebP for a client slot.
 * Prefers Vercel Blob; otherwise public/clients.
 */
export async function storeClientImages(options: {
  slug: string;
  slot: string;
  avif: Buffer;
  webp: Buffer;
}): Promise<StoredImageUrls> {
  const { slug, slot, avif, webp } = options;
  const base = `clients/${slug}/${slot}`;

  if (isBlobStorageConfigured()) {
    const [src, srcFallback] = await Promise.all([
      putBlob(`${base}.avif`, avif, "image/avif"),
      putBlob(`${base}.webp`, webp, "image/webp"),
    ]);
    return { src, srcFallback, storage: "vercel-blob" };
  }

  const [src, srcFallback] = await Promise.all([
    writeLocal(`${base}.avif`, avif),
    writeLocal(`${base}.webp`, webp),
  ]);
  return { src, srcFallback, storage: "local" };
}

/**
 * Persist a deduplicated stock asset under stock/{provider}/{id}.
 */
export async function storeStockImages(options: {
  provider: string;
  id: string;
  avif: Buffer;
  webp: Buffer;
}): Promise<StoredImageUrls> {
  const { provider, id, avif, webp } = options;
  const base = `stock/${provider}/${id}`;

  if (isBlobStorageConfigured()) {
    const [src, srcFallback] = await Promise.all([
      putBlob(`${base}.avif`, avif, "image/avif"),
      putBlob(`${base}.webp`, webp, "image/webp"),
    ]);
    return { src, srcFallback, storage: "vercel-blob" };
  }

  const [src, srcFallback] = await Promise.all([
    writeLocal(`${base}.avif`, avif),
    writeLocal(`${base}.webp`, webp),
  ]);
  return { src, srcFallback, storage: "local" };
}
