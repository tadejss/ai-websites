import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteConfig: SiteConfig;
};

export function BeautyFooter({ siteConfig }: Props) {
  const { brand, footer } = siteConfig;

  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted sm:flex-row sm:px-6">
        <p>
          &copy; {new Date().getFullYear()} {brand.prefix} {brand.highlight}.{" "}
          {footer.rights}
        </p>
        <p className="text-center sm:text-right">{footer.address}</p>
      </div>
    </footer>
  );
}
