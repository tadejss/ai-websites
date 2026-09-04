import type { MetadataRoute } from "next";

export function getAdminManifest(): MetadataRoute.Manifest {
  return {
    name: "Zbrendiraj",
    short_name: "Zbrendiraj",
    description: "Ops console for zbrendiraj.si",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/brand/zbrendiraj-si/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/zbrendiraj-si/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/zbrendiraj-si/icon.png",
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
