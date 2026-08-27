import Image from "next/image";

type Props = {
  src?: string;
  srcFallback?: string;
  alt?: string;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
};

export function TradeImage({
  src,
  srcFallback,
  alt = "",
  className = "",
  priority = false,
  width,
  height,
}: Props) {
  if (!src) {
    return null;
  }

  if (srcFallback) {
    return (
      <div
        className={`relative overflow-hidden rounded-[var(--radius-card)] ${className}`}
      >
        <picture>
          <source srcSet={src} type="image/avif" />
          <source srcSet={srcFallback} type="image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element -- intentional AVIF/WebP picture fallback */}
          <img
            src={srcFallback}
            alt={alt}
            width={width}
            height={height}
            className="absolute inset-0 h-full w-full object-cover"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
          />
        </picture>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-card)] ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
      />
    </div>
  );
}
