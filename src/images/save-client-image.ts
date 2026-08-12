import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ImageSlot } from "./types";

export function saveClientImage(
  slug: string,
  slot: ImageSlot,
  data: Buffer,
): string {
  const clientDir = resolve(process.cwd(), "public/clients", slug);
  mkdirSync(clientDir, { recursive: true });

  const filename = `${slot}.jpg`;
  const filePath = resolve(clientDir, filename);
  writeFileSync(filePath, data);

  return `/clients/${slug}/${filename}`;
}
