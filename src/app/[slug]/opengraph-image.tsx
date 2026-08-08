import { ImageResponse } from "next/og";
import { getSiteConfig } from "@/content/get-site-config";

export const alt = "Business website preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function Image({ params }: Props) {
  const { slug } = await params;

  let title = "Website";
  let description = "";

  try {
    const config = getSiteConfig(slug);
    title = config.metadata.title;
    description = config.metadata.description;
  } catch {
    // Unknown slugs still get a generic card rather than a hard failure.
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(145deg, #0f172a 0%, #1e293b 55%, #0ea5e9 160%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#7dd3fc",
            fontWeight: 600,
          }}
        >
          Lokalna spletna stran
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.35,
                color: "#cbd5e1",
                maxWidth: 920,
              }}
            >
              {description.length > 160
                ? `${description.slice(0, 157)}...`
                : description}
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
