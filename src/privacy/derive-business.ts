import type { BusinessInput } from "@/ai/types";
import type { SiteBusinessInfo, SiteConfig } from "@/content/types/site";

function contactValue(
  config: Pick<SiteConfig, "contact">,
  icon: "email" | "phone",
): string | undefined {
  const item = config.contact.items.find((entry) => entry.icon === icon);
  const value = item?.value?.trim();

  return value || undefined;
}

function emailFromMailto(
  config: Pick<SiteConfig, "contact">,
): string | undefined {
  const item = config.contact.items.find((entry) => entry.icon === "email");
  const href = item?.href?.trim();

  if (href?.startsWith("mailto:")) {
    const email = href.slice("mailto:".length).split("?")[0]?.trim();

    if (email) {
      return email;
    }
  }

  return contactValue(config, "email");
}

export function deriveBusinessFromSiteConfig(
  config: Pick<SiteConfig, "brand" | "footer" | "contact">,
  businessInput?: BusinessInput,
): SiteBusinessInfo {
  const name =
    businessInput?.companyName?.trim() ||
    `${config.brand.prefix} ${config.brand.highlight}`.trim();

  return {
    name,
    legalName: businessInput?.companyName?.trim() || undefined,
    address:
      businessInput?.address?.trim() || config.footer.address.trim() || "",
    email: businessInput?.email?.trim() || emailFromMailto(config) || "",
    phone: businessInput?.phone?.trim() || contactValue(config, "phone"),
    registrationNumber: undefined,
    vatNumber: undefined,
  };
}

export function mergeBusinessInfo(
  derived: SiteBusinessInfo,
  existing?: SiteBusinessInfo,
): SiteBusinessInfo {
  if (!existing) {
    return derived;
  }

  return {
    name: existing.name?.trim() || derived.name,
    legalName: existing.legalName?.trim() || derived.legalName,
    address: existing.address?.trim() || derived.address,
    email: existing.email?.trim() || derived.email,
    phone: existing.phone?.trim() || derived.phone,
    registrationNumber: existing.registrationNumber?.trim() || undefined,
    vatNumber: existing.vatNumber?.trim() || undefined,
  };
}
