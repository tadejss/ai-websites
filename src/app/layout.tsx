import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSiteBaseUrl } from "@/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteBaseUrl = getSiteBaseUrl();

export const metadata: Metadata = {
  ...(siteBaseUrl ? { metadataBase: new URL(siteBaseUrl) } : {}),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
