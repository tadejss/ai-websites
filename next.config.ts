import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  outputFileTracingIncludes: {
    "/[slug]/opengraph-image": ["./public/clients/**/*"],
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
