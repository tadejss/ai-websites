"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Props = React.ComponentProps<typeof Image> & {
  fadeDelay?: number;
};

export function FadeImage({ className, fadeDelay = 0, alt = "", ...rest }: Props) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setTimeout(() => {
            setIsInView(true);
          }, fadeDelay);
          observer.disconnect();
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.1, rootMargin: "50px" },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [fadeDelay]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <Image
        {...rest}
        alt={alt}
        className={`${className || ""} transition-all duration-700 ease-out ${
          isInView && isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]"
        }`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
