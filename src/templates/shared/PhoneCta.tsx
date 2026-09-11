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
      className={`inline-flex min-h-12 w-full max-w-full flex-nowrap items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] px-4 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:w-auto sm:px-5 sm:text-base ${variantClass} ${className}`}
    >
      <span className="min-w-0 truncate">{text}</span>
      <span className="shrink-0 font-medium opacity-80">{phone}</span>
    </a>
  );
}
