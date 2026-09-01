import type { Metadata, Viewport } from "next";
import "@/app/globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Website Factory Ops",
    template: "%s · Factory Ops",
  },
  description: "Ops console for zbrendiraj.si website factory",
  applicationName: "Factory Ops",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Factory Ops",
  },
  themeColor: "#0a0a0b",
  manifest: "/admin/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/admin/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/admin/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/admin/icon-192.png", sizes: "192x192", type: "image/png" }],
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
