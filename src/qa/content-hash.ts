import { createHash } from "node:crypto";
import type { BusinessInput } from "@/ai/types";
import type { SiteConfig } from "@/content/types/site";

export function hashQaContent(
  site: SiteConfig,
  business: BusinessInput,
): string {
  const canonical = JSON.stringify({
    site,
    business,
  });
  return createHash("sha256").update(canonical).digest("hex");
}
