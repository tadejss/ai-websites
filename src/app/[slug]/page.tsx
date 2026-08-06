import { SitePage } from "../site-page";
import { getSiteConfig } from "@/content/get-site-config";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ClientPage({ params }: Props) {
  const { slug } = await params;
  const siteConfig = getSiteConfig(slug);

  return <SitePage siteConfig={siteConfig} />;
}