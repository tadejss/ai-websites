import { Geist, Geist_Mono, Inter, Oswald } from "next/font/google";

/**
 * Root layout fonts only: app chrome + zbrendiraj marketing site.
 * Demo templates load their own fonts in SitePage (max 2 per template).
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const rootFontVariables = [
  geistSans.variable,
  geistMono.variable,
  inter.variable,
  oswald.variable,
].join(" ");
