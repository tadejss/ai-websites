import { SitePage } from "./site-page";
import { siteConfig } from "@/content/site";

export default function Home() {
  return <SitePage siteConfig={siteConfig} />;
}