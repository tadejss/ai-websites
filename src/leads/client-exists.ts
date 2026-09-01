import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Resolve client site.json from the repo root.
 * Do not use __dirname here — Next.js production bundles rewrite it to a
 * virtual "/ROOT/..." path, so existsSync always fails at runtime.
 */
export function clientSiteExists(slug: string): boolean {
  if (!slug.trim()) {
    return false;
  }

  return existsSync(clientSitePath(slug));
}

export function clientSitePath(slug: string): string {
  return resolve(process.cwd(), "src/content/clients", slug, "site.json");
}
