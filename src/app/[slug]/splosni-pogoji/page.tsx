import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TermsOfServiceContent } from "@/privacy/components/TermsOfServiceContent";
import { LegalPageLayout } from "@/privacy/components/LegalPageLayout";
import {
  getLegalPageContext,
  legalPageDescription,
  legalPageTitle,
  legalStaticParams,
} from "@/privacy/legal-page-context";
import { siteSlugs } from "@/content/sites";
import { withBrandIcons } from "@/lib/branding";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return legalStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { siteConfig } = getLegalPageContext("terms", slug);

    return withBrandIcons(
      {
        title: legalPageTitle("terms", siteConfig),
        description: legalPageDescription("terms", siteConfig),
        robots: { index: true, follow: true },
        alternates: {
          canonical: `/${slug}/splosni-pogoji`,
        },
      },
      siteConfig,
    );
  } catch {
    return { title: "Stran ni najdena" };
  }
}

export default async function TermsOfServicePage({ params }: Props) {
  const { slug } = await params;

  if (!siteSlugs.includes(slug)) {
    notFound();
  }

  let context;

  try {
    context = getLegalPageContext("terms", slug);
  } catch {
    notFound();
  }

  if (!context.siteConfig.privacy.terms?.enabled) {
    notFound();
  }

  return (
    <LegalPageLayout
      siteConfig={context.siteConfig}
      siteSlug={context.slug}
      title="Splošni pogoji"
    >
      <TermsOfServiceContent siteConfig={context.siteConfig} />
    </LegalPageLayout>
  );
}
