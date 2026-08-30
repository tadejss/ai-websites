import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SitePage } from "../site-page";
import { getSiteConfig } from "@/content/get-site-config";
import { siteSlugs } from "@/content/sites";
import type { SiteConfig } from "@/content/types/site";
import { toAbsoluteUrl } from "@/site-url";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return siteSlugs.map((slug) => ({ slug }));
}

function buildMetadata(slug: string, config: SiteConfig): Metadata {
  const { title, description } = config.metadata;
  const canonical = toAbsoluteUrl(`/${slug}`);

  return {
    title,
    description,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: canonical || `/${slug}`,
      type: "website",
      locale: "sl_SI",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    return buildMetadata(slug, getSiteConfig(slug));
  } catch {
    return {
      title: "Page not found",
    };
  }
}

function LocalBusinessJsonLd({
  slug,
  config,
}: {
  slug: string;
  config: SiteConfig;
}) {
  const phone = config.contact.items.find((item) => item.icon === "phone");
  const name = `${config.brand.prefix} ${config.brand.highlight}`.trim();
  const url = toAbsoluteUrl(`/${slug}`) || undefined;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    description: config.metadata.description,
  };

  if (config.footer.address.trim()) {
    data.address = config.footer.address;
  }

  if (phone?.value.trim()) {
    data.telephone = phone.value;
  }

  if (url) {
    data.url = url;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function ClientPage({ params }: Props) {
  const { slug } = await params;

  let siteConfig: SiteConfig;

  try {
    siteConfig = getSiteConfig(slug);
  } catch {
    notFound();
  }

  return (
    <>
      <LocalBusinessJsonLd slug={slug} config={siteConfig} />
      <SitePage siteConfig={siteConfig} siteSlug={slug} />
    </>
  );
}

export const dynamic = "force-dynamic";
