import type { ContactItem, SiteConfig } from "@/content/types/site";

export function getPhoneContactItem(
  config: SiteConfig,
): ContactItem | undefined {
  return config.contact.items.find(
    (item) => item.icon === "phone" || /telefon/i.test(item.label),
  );
}

export function getPhoneHref(config: SiteConfig): string | undefined {
  const phone = getPhoneContactItem(config);
  if (!phone) {
    return undefined;
  }
  if (phone.href?.startsWith("tel:")) {
    return phone.href;
  }
  const digits = phone.value.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : undefined;
}

export function getPhoneLabel(config: SiteConfig): string | undefined {
  return getPhoneContactItem(config)?.value;
}

export function brandDisplayName(config: SiteConfig): string {
  const fromBrand = `${config.brand.prefix} ${config.brand.highlight}`.trim();
  return config.business?.name?.trim() || fromBrand || config.metadata.title;
}

export function getAddress(config: SiteConfig): string | undefined {
  const item = config.contact.items.find((entry) => entry.icon === "location");
  return item?.value || config.footer.address || config.business?.address;
}

export function getHours(config: SiteConfig): string | undefined {
  return config.contact.items.find((entry) => entry.icon === "clock")?.value;
}

export function getEmail(config: SiteConfig): ContactItem | undefined {
  return config.contact.items.find((entry) => entry.icon === "email");
}
