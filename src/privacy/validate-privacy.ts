import type { SiteConfig } from "@/content/types/site";

export function findPrivacyProblems(config: SiteConfig): string[] {
  const problems: string[] = [];

  if (!config.privacy.enabled) {
    return problems;
  }

  if (!config.business.name?.trim()) {
    problems.push("business.name is missing");
  }

  if (!config.business.address?.trim()) {
    problems.push("business.address is missing");
  }

  if (!config.business.email?.trim()) {
    problems.push("business.email is missing");
  }

  if (config.privacy.contactForm.enabled) {
    if (!config.privacy.contactForm.fields.length) {
      problems.push("privacy.contactForm.fields is empty");
    }
  }

  if (config.privacy.booking.enabled) {
    if (!config.privacy.booking.providerName?.trim()) {
      problems.push("privacy.booking.providerName is missing");
    }

    if (!config.privacy.booking.url?.trim()) {
      problems.push("privacy.booking.url is missing");
    }
  }

  return problems;
}
