import Image from "next/image";

type Props = {
  src?: string;
  alt?: string;
  className?: string;
  priority?: boolean;
};

export function TradeImage({
  src,
  alt = "",
  className = "",
  priority = false,
}: Props) {
  if (!src) {
    return null;
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
