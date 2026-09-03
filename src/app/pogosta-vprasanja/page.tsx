import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZbrendirajFaqContent } from "@/appearances/zbrendiraj/components/ZbrendirajFaqContent";
import { getSiteConfig } from "@/content/get-site-config";
import { LegalPageLayout } from "@/privacy/components/LegalPageLayout";
import { withBrandIcons } from "@/lib/branding";

const SLUG = "zbrendiraj-si";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const siteConfig = getSiteConfig(SLUG);

    return withBrandIcons(
      {
        title: `Pogosta vprašanja – ${siteConfig.business.name}`,
        description:
          "Odgovori na pogosta vprašanja o naročnini, domeni, izdelavi in vzdrževanju spletne strani na Zbrendiraj.si.",
        robots: { index: true, follow: true },
        alternates: {
          canonical: "/pogosta-vprasanja",
        },
      },
      siteConfig,
    );
  } catch {
    return { title: "Stran ni najdena" };
  }
}

export default function RootFaqPage() {
  let siteConfig;

  try {
    siteConfig = getSiteConfig(SLUG);
  } catch {
    notFound();
  }

  if (siteConfig.appearance !== "zbrendiraj") {
    notFound();
  }

  return (
    <LegalPageLayout
      siteConfig={siteConfig}
      siteSlug={SLUG}
      title="Pogosta vprašanja"
    >
      <ZbrendirajFaqContent />
    </LegalPageLayout>
  );
}
