import type { SiteImage } from "@/content/types/site";

type Props = {
  image?: SiteImage;
  alt?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function TemplateImage({
  image,
  alt,
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: Props) {
  if (!image?.src) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- template demos use optimized public/Blob URLs already
    <img
      src={image.src}
      alt={alt || image.alt || ""}
      width={image.width}
      height={image.height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      sizes={sizes}
      className={className}
    />
  );
}
