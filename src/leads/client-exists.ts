import { existsSync } from "node:fs";
import { resolve } from "node:path";

const clientsDir = resolve(__dirname, "../content/clients");

export function clientSiteExists(slug: string): boolean {
  if (!slug.trim()) {
    return false;
  }

  return existsSync(resolve(clientsDir, slug, "site.json"));
}
