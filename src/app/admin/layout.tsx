import type { Metadata, Viewport } from "next";
import "@/app/globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: {
    default: "Zbrendiraj",
    template: "%s · Zbrendiraj",
  },
  description: "Ops console for zbrendiraj.si",
  applicationName: "Zbrendiraj",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Zbrendiraj",
  },
  manifest: "/admin/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/zbrendiraj-si/icon.png", type: "image/png" },
      { url: "/admin/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/admin/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/zbrendiraj-si/icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function AdminRootLayout({
  children,
}: LayoutProps<"/admin">) {
  return (
    <div data-admin-theme className="min-h-screen antialiased">
      {children}
    </div>
  );
}
