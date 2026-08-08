import type { Metadata } from "next";
import { SitePage } from "./site-page";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: siteConfig.metadata.title,
  description: siteConfig.metadata.description,
};

export default function Home() {
  return <SitePage siteConfig={siteConfig} />;
}
