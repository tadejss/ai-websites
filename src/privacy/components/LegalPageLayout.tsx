import Link from "next/link";
import type { ReactNode } from "react";
import { ZbrendirajFooter } from "@/appearances/zbrendiraj/components/ZbrendirajFooter";
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
  const isZbrendiraj = appearance === "zbrendiraj";

  return (
    <div
      data-appearance={appearance}
      style={themeStyle}
      className={
        isZbrendiraj
          ? "min-h-full bg-black text-white"
          : "min-h-full bg-background text-foreground"
      }
    >
      <header
        className={
          isZbrendiraj
            ? "border-b border-white/10 bg-black"
            : "border-b border-border bg-background"
        }
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5">
          <Link
            href={`/${siteSlug}`}
            className={
              isZbrendiraj
                ? "text-sm font-medium text-[#D0D0D0] transition-colors hover:text-white"
                : "text-sm font-medium text-muted transition-colors hover:text-foreground"
            }
          >
            ← Nazaj na {brandName}
          </Link>
        </div>
      </header>

      <main
        className={
          isZbrendiraj
            ? "mx-auto max-w-3xl bg-black px-6 py-10 text-white"
            : "mx-auto max-w-3xl px-6 py-10"
        }
      >
        <h1
          className={
            isZbrendiraj
              ? "font-display text-3xl tracking-tight text-white sm:text-4xl"
              : "text-3xl font-semibold tracking-tight text-foreground"
          }
        >
          {title}
        </h1>
        <div
          className={
            isZbrendiraj
              ? "prose-legal mt-8 space-y-8 text-base leading-7 text-[#D0D0D0] [&_a]:text-accent [&_h2]:font-display [&_h2]:text-white"
              : "prose-legal mt-8 space-y-8 text-base leading-7 text-foreground/90"
          }
        >
          {children}
        </div>
      </main>

      {isZbrendiraj ? (
        <ZbrendirajFooter siteConfig={siteConfig} siteSlug={siteSlug} />
      ) : (
        <footer className="border-t border-border py-8">
          <div className="mx-auto max-w-3xl px-6 text-sm text-muted">
            <p>{siteConfig.footer.address}</p>
          </div>
        </footer>
      )}
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
