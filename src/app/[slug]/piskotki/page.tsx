import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CookiePolicyContent } from "@/privacy/components/CookiePolicyContent";
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
    const { siteConfig } = getLegalPageContext("cookies", slug);

    return withBrandIcons(
      {
        title: legalPageTitle("cookies", siteConfig),
        description: legalPageDescription("cookies", siteConfig),
        robots: { index: true, follow: true },
        alternates: {
          canonical: `/${slug}/piskotki`,
        },
      },
      siteConfig,
    );
  } catch {
    return { title: "Stran ni najdena" };
  }
}

export default async function CookiePolicyPage({ params }: Props) {
  const { slug } = await params;

  if (!siteSlugs.includes(slug)) {
    notFound();
  }

  let context;

  try {
    context = getLegalPageContext("cookies", slug);
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
