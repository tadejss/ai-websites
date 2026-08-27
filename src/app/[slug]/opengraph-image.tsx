import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { formatBrandName } from "@/content/brand-name";
import { getSiteConfig } from "@/content/get-site-config";

export const runtime = "nodejs";
export const alt = "Predogled spletne strani";
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

function mimeForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "avif") return "image/avif";
  return "image/jpeg";
}

async function bufferToDataUrl(
  buffer: Buffer,
  mime: string,
): Promise<string> {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function loadFromPublic(relativePath: string): Promise<string | null> {
  const absolute = join(process.cwd(), "public", relativePath);
  if (!existsSync(absolute)) {
    return null;
  }
  const buffer = await readFile(absolute);
  return bufferToDataUrl(buffer, mimeForPath(absolute));
}

async function loadFromRemote(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());
    return bufferToDataUrl(buffer, contentType.split(";")[0]!.trim());
  } catch {
    return null;
  }
}

async function loadHeroDataUrl(
  slug: string,
  heroSrc?: string,
  heroFallback?: string,
): Promise<string | null> {
  // Prefer WebP/JPEG over AVIF for OG (broader encoder support in Satori).
  const preferred = [heroFallback, heroSrc].filter(
    (value): value is string => Boolean(value),
  );

  for (const src of preferred) {
    if (src.startsWith("http://") || src.startsWith("https://")) {
      const remote = await loadFromRemote(src);
      if (remote) {
        return remote;
      }
      continue;
    }

    const relative = src.startsWith("/") ? src.slice(1) : src;
    const local = await loadFromPublic(relative);
    if (local) {
      return local;
    }
  }

  const legacy = [
    `clients/${slug}/hero.webp`,
    `clients/${slug}/hero.avif`,
    `clients/${slug}/hero.jpg`,
    `clients/${slug}/hero.jpeg`,
    `clients/${slug}/hero.png`,
  ];

  for (const relative of legacy) {
    const local = await loadFromPublic(relative);
    if (local) {
      return local;
    }
  }

  return null;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;

  let brandName = "Zbrendiraj.si";
  let title = "Spletna stran";
  let description = "";
  let heroSrc: string | undefined;
  let heroFallback: string | undefined;

  try {
    const config = getSiteConfig(slug);
    brandName = formatBrandName(config.brand);
    title = config.metadata.title;
    description = config.metadata.description;
    heroSrc = config.images?.hero?.src;
    heroFallback = config.images?.hero?.srcFallback;
  } catch {
    // Unknown slugs still get a generic card rather than a hard failure.
  }

  const heroDataUrl = await loadHeroDataUrl(slug, heroSrc, heroFallback);

  if (heroDataUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
            background: "#0f172a",
          }}
        >
          {/* Hero photo fills the iMessage / Open Graph card. */}
          <img
            src={heroDataUrl}
            alt=""
            width={1200}
            height={630}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "56px 64px",
              background:
                "linear-gradient(180deg, rgba(15,23,42,0) 35%, rgba(15,23,42,0.82) 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 22,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#e2e8f0",
                fontWeight: 600,
              }}
            >
              {brandName}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 12,
                fontSize: 44,
                fontWeight: 700,
                lineHeight: 1.15,
                color: "#f8fafc",
                maxWidth: 980,
              }}
            >
              {title.length > 90 ? `${title.slice(0, 87)}…` : title}
            </div>
          </div>
        </div>
      ),
      { ...size },
    );
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
          background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
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
            color: "#94a3b8",
            fontWeight: 600,
          }}
        >
          {brandName}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 56,
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
                fontSize: 28,
                lineHeight: 1.35,
                color: "#cbd5e1",
                maxWidth: 920,
              }}
            >
              {description.length > 160
                ? `${description.slice(0, 157)}…`
                : description}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size },
  );
}
