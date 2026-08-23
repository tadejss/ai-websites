import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZbrendirajFaqContent } from "@/appearances/zbrendiraj/components/ZbrendirajFaqContent";
import { getSiteConfig } from "@/content/get-site-config";
import { siteSlugs } from "@/content/sites";
import { LegalPageLayout } from "@/privacy/components/LegalPageLayout";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return siteSlugs
    .filter((slug) => {
      try {
        return getSiteConfig(slug).appearance === "zbrendiraj";
      } catch {
        return false;
      }
    })
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const siteConfig = getSiteConfig(slug);
    if (siteConfig.appearance !== "zbrendiraj") {
      return { title: "Stran ni najdena" };
    }

    return {
      title: `Pogosta vprašanja – ${siteConfig.business.name}`,
      description:
        "Odgovori na pogosta vprašanja o naročnini, domeni, izdelavi in vzdrževanju spletne strani na Zbrendiraj.si.",
      robots: { index: true, follow: true },
      alternates: {
        canonical: `/${slug}/pogosta-vprasanja`,
      },
    };
  } catch {
    return { title: "Stran ni najdena" };
  }
}

export default async function FaqPage({ params }: Props) {
  const { slug } = await params;

  if (!siteSlugs.includes(slug)) {
    notFound();
  }

  let siteConfig;

  try {
    siteConfig = getSiteConfig(slug);
  } catch {
    notFound();
  }

  if (siteConfig.appearance !== "zbrendiraj") {
    notFound();
  }

  return (
    <LegalPageLayout
      siteConfig={siteConfig}
      siteSlug={slug}
      title="Pogosta vprašanja"
    >
      <ZbrendirajFaqContent />
    </LegalPageLayout>
  );
}
