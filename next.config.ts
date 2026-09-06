import type { NextConfig } from "next";
import {
  ADMIN_CONTENT_SECURITY_POLICY,
  BASE_SECURITY_HEADERS,
  CONTENT_SECURITY_POLICY,
  productionHstsHeader,
} from "./src/lib/security-headers";

const hsts = productionHstsHeader();

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
  async headers() {
    const shared = [...BASE_SECURITY_HEADERS, ...(hsts ? [hsts] : [])];

    return [
      {
        source: "/admin/:path*",
        headers: [
          ...shared,
          {
            key: "Content-Security-Policy",
            value: ADMIN_CONTENT_SECURITY_POLICY,
          },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          ...shared,
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
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
