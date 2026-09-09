import { notFound } from "next/navigation";
import { SitePage } from "@/app/site-page";
import { getSiteConfig } from "@/content/get-site-config";
import { isCuratedPaletteId } from "@/theme/palettes/curated";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    slug: string;
    paletteId: string;
  }>;
};

/** Dev-only palette override frame (path-based; keeps public `/[slug]` ISR-clean). */
export default async function PalettePreviewPage({ params }: Props) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { slug, paletteId } = await params;
  if (!isCuratedPaletteId(paletteId)) {
    notFound();
  }

  let siteConfig;
  try {
    siteConfig = getSiteConfig(slug);
  } catch {
    notFound();
  }

  return (
    <SitePage
      siteConfig={siteConfig}
      siteSlug={slug}
      paletteOverride={paletteId}
    />
  );
}
