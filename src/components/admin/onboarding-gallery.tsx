"use client";

import { useState } from "react";
import type { OnboardingImage } from "@/onboarding/types";

type Props = {
  images: OnboardingImage[];
};

function imageLabel(image: OnboardingImage): string {
  if (image.fileName?.trim()) {
    return image.fileName.trim();
  }
  try {
    const pathname = new URL(image.url).pathname;
    return pathname.split("/").pop() ?? image.url;
  } catch {
    return image.url;
  }
}

function GalleryThumbnail({
  image,
  onOpen,
}: {
  image: OnboardingImage;
  onOpen: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const label = imageLabel(image);

  if (failed) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex aspect-square w-full flex-col items-center justify-center rounded-[var(--admin-radius)] border border-red-500/30 bg-red-500/10 p-2 text-center text-xs text-red-300"
      >
        <span className="font-medium">Slika ni na voljo</span>
        <span className="mt-1 line-clamp-2 break-all text-[10px]">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative overflow-hidden rounded-[var(--admin-radius)] border border-white/15 bg-white/[0.03] text-left"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={label}
        className="aspect-square w-full object-cover transition group-hover:opacity-90"
        onError={() => setFailed(true)}
      />
      <div className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-1 text-[10px] text-white truncate">
        {image.kind === "logo" ? "Logo · " : "Foto · "}
        {label}
      </div>
    </button>
  );
}

export function OnboardingImageGallery({ images }: Props) {
  const [lightbox, setLightbox] = useState<OnboardingImage | null>(null);
  const [lightboxFailed, setLightboxFailed] = useState(false);

  if (images.length === 0) {
    return (
      <p className="text-sm text-[var(--admin-muted)]">Ni uploadanih slik.</p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image) => (
          <GalleryThumbnail
            key={image.url}
            image={image}
            onOpen={() => {
              setLightboxFailed(false);
              setLightbox(image);
            }}
          />
        ))}
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLightbox(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setLightbox(null);
            }
          }}
          role="presentation"
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-[var(--admin-radius)] border border-white/15 bg-black shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Predogled slike"
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2 py-1 text-sm text-white hover:bg-black/80"
            >
              ✕
            </button>
            {lightboxFailed ? (
              <div className="flex min-h-[240px] min-w-[320px] flex-col items-center justify-center p-8 text-center">
                <p className="font-medium text-red-300">Slika ni na voljo</p>
                <p className="mt-2 text-sm text-[var(--admin-muted)] break-all">
                  {imageLabel(lightbox)}
                </p>
                <a
                  href={lightbox.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 text-sm text-[var(--admin-accent)] hover:underline"
                >
                  Odpri URL
                </a>
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightbox.url}
                  alt={imageLabel(lightbox)}
                  className="max-h-[85vh] max-w-full object-contain"
                  onError={() => setLightboxFailed(true)}
                />
                <div className="border-t border-white/15 px-4 py-3 text-sm text-[#d0d0d0]">
                  <span className="font-medium">
                    {lightbox.kind === "logo" ? "Logo" : "Fotografija"}
                  </span>
                  {" · "}
                  {imageLabel(lightbox)}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
