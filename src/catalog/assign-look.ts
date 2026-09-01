import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ImagePoolCategoryId } from "@/images/image-pool-category";
import type { SiteLookDefinition, SiteLookId } from "@/catalog/types";
import { hashString } from "@/lib/hash-string";
import { getApprovedLooksForCategory } from "@/catalog/looks";

function getClientsDir(): string {
  return resolve(process.cwd(), "src/content/clients");
}

export function getUsedLookIds(): Set<string> {
  const clientsDir = getClientsDir();

  if (!existsSync(clientsDir)) {
    return new Set();
  }

  const used = new Set<string>();

  for (const entry of readdirSync(clientsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const sitePath = resolve(clientsDir, entry.name, "site.json");

    if (!existsSync(sitePath)) {
      continue;
    }

    try {
      const parsed = JSON.parse(readFileSync(sitePath, "utf8")) as {
        lookId?: string;
      };

      if (parsed.lookId) {
        used.add(parsed.lookId);
      }
    } catch {
      // Ignore malformed site configs when scanning for collisions.
    }
  }

  return used;
}

export function assignLook(
  categoryId: ImagePoolCategoryId,
  slug: string,
  usedLookIds: Set<string> = getUsedLookIds(),
): SiteLookDefinition {
  const approved = getApprovedLooksForCategory(categoryId);

  if (approved.length === 0) {
    throw new Error(`No approved looks for category "${categoryId}".`);
  }

  const start = hashString(`${slug}:${categoryId}`) % approved.length;

  for (let offset = 0; offset < approved.length; offset += 1) {
    const look = approved[(start + offset) % approved.length]!;
    if (!usedLookIds.has(look.id)) {
      return look;
    }
  }

  return approved[start]!;
}
