import type { Metadata } from "next";
import { fontVariables } from "@/theme/fonts/load-fonts";
import { getSiteBaseUrl } from "@/site-url";
import "./globals.css";

const siteBaseUrl = getSiteBaseUrl();

export const metadata: Metadata = {
  ...(siteBaseUrl ? { metadataBase: new URL(siteBaseUrl) } : {}),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sl" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
