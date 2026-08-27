import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/[slug]/opengraph-image": [
      "./public/clients/**/*",
      "./public/stock/**/*",
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "splet.vercel.app" }],
        destination: "https://zbrendiraj.si/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.splet.vercel.app" }],
        destination: "https://zbrendiraj.si/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
