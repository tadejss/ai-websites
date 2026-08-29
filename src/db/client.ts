import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;

/** True when DATABASE_URL (or POSTGRES_URL) is configured. */
export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    undefined
  );
}

/**
 * Neon / Vercel Postgres SQL tagged template client.
 * Throws if no database URL is configured.
 */
export function sql(): NeonQueryFunction<false, false> {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured. Add a Neon / Vercel Postgres database.",
    );
  }

  if (!sqlClient) {
    sqlClient = neon(url);
  }

  return sqlClient;
}
