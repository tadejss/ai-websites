import Image from "next/image";
import type { SiteConfig } from "@/content/types/site";
import { getBrandLogo } from "@/lib/branding";

type Props = {
  config: SiteConfig;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
};

export function SiteBrandMark({
  config,
  alt,
  width = 36,
  height = 36,
  className,
}: Props) {
  const logo = getBrandLogo(config);
  if (!logo) {
    return null;
  }

  return (
    <Image
      src={logo}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
