import type { SiteConfig } from "@/content/types/site";
import { getPhoneHref, getPhoneLabel } from "./contact-data";

type Props = {
  siteConfig: SiteConfig;
  label?: string;
  className?: string;
  variant?: "solid" | "outline" | "text";
};

export function PhoneCta({
  siteConfig,
  label,
  className = "",
  variant = "solid",
}: Props) {
  const href = getPhoneHref(siteConfig);
  const phone = getPhoneLabel(siteConfig);
  if (!href || !phone) {
    return null;
  }

  const text = label?.trim() || siteConfig.hero.primaryCta || "Pokličite";

  const variantClass =
    variant === "outline"
      ? "border-2 border-current bg-transparent"
      : variant === "text"
        ? "bg-transparent underline-offset-4 hover:underline px-0"
        : "bg-[var(--accent)] text-[var(--accent-foreground)] border-2 border-transparent";

  return (
    <a
      href={href}
      className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius)] px-5 text-base font-semibold transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:inline-flex sm:w-auto ${variantClass} ${className}`}
    >
      <span>{text}</span>
      <span className="font-medium opacity-80">{phone}</span>
    </a>
  );
}
