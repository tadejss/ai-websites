import type { SiteConfig } from "@/content/types/site";

export type BusinessInput = {
  companyName?: string;
  industry?: string;
  tagline?: string;
  services?: string[];
  phone?: string;
  email?: string;
  address?: string;
  openingHours?: string;
  sellingPoints?: string[];
};

export async function generateSiteConfig(
  _input: BusinessInput,
): Promise<SiteConfig> {
  throw new Error("AI provider not configured");
}
