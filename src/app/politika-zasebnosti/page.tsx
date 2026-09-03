import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrivacyPolicyContent } from "@/privacy/components/PrivacyPolicyContent";
import { LegalPageLayout } from "@/privacy/components/LegalPageLayout";
import {
  getLegalPageContext,
  legalPageDescription,
  legalPageTitle,
} from "@/privacy/legal-page-context";
import { withBrandIcons } from "@/lib/branding";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { siteConfig } = getLegalPageContext("privacy");

    return withBrandIcons(
      {
        title: legalPageTitle("privacy", siteConfig),
        description: legalPageDescription("privacy", siteConfig),
        robots: { index: true, follow: true },
        alternates: {
          canonical: "/politika-zasebnosti",
        },
      },
      siteConfig,
    );
  } catch {
    return { title: "Stran ni najdena" };
  }
}

export default function RootPrivacyPolicyPage() {
  let context;

  try {
    context = getLegalPageContext("privacy");
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
