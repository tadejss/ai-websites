import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrivacyPolicyContent } from "@/privacy/components/PrivacyPolicyContent";
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
    const { siteConfig } = getLegalPageContext("privacy", slug);

    return withBrandIcons(
      {
        title: legalPageTitle("privacy", siteConfig),
        description: legalPageDescription("privacy", siteConfig),
        robots: { index: true, follow: true },
        alternates: {
          canonical: `/${slug}/politika-zasebnosti`,
        },
      },
      siteConfig,
    );
  } catch {
    return { title: "Stran ni najdena" };
  }
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { slug } = await params;

  if (!siteSlugs.includes(slug)) {
    notFound();
  }

  let context;

  try {
    context = getLegalPageContext("privacy", slug);
  } catch {
    notFound();
  }

  return (
    <LegalPageLayout
      siteConfig={context.siteConfig}
      siteSlug={context.slug}
      title="Politika zasebnosti"
    >
      <PrivacyPolicyContent siteConfig={context.siteConfig} />
    </LegalPageLayout>
  );
}
