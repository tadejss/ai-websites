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
    default: "Zbrendiraj Admin",
    template: "%s · Zbrendiraj Admin",
  },
  description: "Ops console for zbrendiraj.si",
  applicationName: "Zbrendiraj Admin",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Zbrendiraj Admin",
  },
  manifest: "/admin/manifest.webmanifest",
  icons: {
    icon: [{ url: "/brand/zbrendiraj-si/icon.png", type: "image/png" }],
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
