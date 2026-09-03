import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSiteConfig } from "@/content/get-site-config";
import { getBrandIconUrl } from "@/lib/branding";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

async function readPublicIcon(relativePath: string): Promise<Response> {
  const filePath = join(process.cwd(), "public", relativePath);
  const buffer = await readFile(filePath);
  return new Response(buffer, {
    headers: { "Content-Type": "image/png" },
  });
}

export default async function Icon({ params }: Props) {
  const { slug } = await params;

  try {
    const config = getSiteConfig(slug);
    const relative = getBrandIconUrl(config).replace(/^\//, "");
    if (existsSync(join(process.cwd(), "public", relative))) {
      return readPublicIcon(relative);
    }
  } catch {
    // fall through to Zbrendiraj default
  }

  return readPublicIcon("brand/zbrendiraj-si/icon.png");
}
