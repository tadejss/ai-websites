import Link from "next/link";
import type { ReactNode } from "react";
import type { SiteConfig } from "@/content/types/site";
import { resolveThemeCssVars } from "@/theme/resolve-theme";
import { resolveAppearance } from "@/appearances/resolve-appearance";

type Props = {
  siteConfig: SiteConfig;
  siteSlug: string;
  title: string;
  children: ReactNode;
};

export function LegalPageLayout({ siteConfig, siteSlug, title, children }: Props) {
  const appearance = resolveAppearance(siteConfig.appearance);
  const themeStyle = resolveThemeCssVars(siteConfig.theme, appearance);
  const brandName = `${siteConfig.brand.prefix} ${siteConfig.brand.highlight}`.trim();

  return (
    <div
      data-appearance={appearance}
      style={themeStyle}
      className="min-h-full bg-background text-foreground"
    >
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5">
          <Link
            href={`/${siteSlug}`}
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            ← Nazaj na {brandName}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <div className="prose-legal mt-8 space-y-8 text-base leading-7 text-foreground/90">
          {children}
        </div>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-3xl px-6 text-sm text-muted">
          <p>{siteConfig.footer.address}</p>
        </div>
      </footer>
    </div>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export { LegalSection };
