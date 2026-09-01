import type { MetadataRoute } from "next";

export function getAdminManifest(): MetadataRoute.Manifest {
  return {
    name: "Website Factory Ops",
    short_name: "Factory Ops",
    description: "Ops console for zbrendiraj.si website factory",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/admin/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/admin/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/admin/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

export function GET() {
  return Response.json(getAdminManifest(), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
