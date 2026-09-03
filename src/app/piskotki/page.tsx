import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CookiePolicyContent } from "@/privacy/components/CookiePolicyContent";
import { LegalPageLayout } from "@/privacy/components/LegalPageLayout";
import {
  getLegalPageContext,
  legalPageDescription,
  legalPageTitle,
} from "@/privacy/legal-page-context";
import { withBrandIcons } from "@/lib/branding";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { siteConfig } = getLegalPageContext("cookies");

    return withBrandIcons(
      {
        title: legalPageTitle("cookies", siteConfig),
        description: legalPageDescription("cookies", siteConfig),
        robots: { index: true, follow: true },
        alternates: {
          canonical: "/piskotki",
        },
      },
      siteConfig,
    );
  } catch {
    return { title: "Stran ni najdena" };
  }
}

export default function RootCookiePolicyPage() {
  let context;

  try {
    context = getLegalPageContext("cookies");
  } catch {
    notFound();
  }

  return (
    <LegalPageLayout
      siteConfig={context.siteConfig}
      siteSlug={context.slug}
      title="Politika piškotkov"
    >
      <CookiePolicyContent
        privacy={context.siteConfig.privacy}
        appearance={context.siteConfig.appearance}
      />
    </LegalPageLayout>
  );
}
