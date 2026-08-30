"use client";

import { useCallback, useRef, useState } from "react";
import type { CustomerOnboardingAnswers, OnboardingImage } from "@/onboarding/types";
import {
  appendOnboardingImages,
  listOnboardingImages,
  removeOnboardingImage,
} from "@/onboarding/images";

type PendingFile = {
  id: string;
  file: File;
  previewUrl: string;
};

type UploadProgress = {
  fileName: string;
  status: "uploading" | "done" | "error";
  error?: string;
};

type Props = {
  slug: string;
  token: string;
  kind: "logo" | "photo";
  label: string;
  answers: CustomerOnboardingAnswers;
  onAnswersChange: (answers: CustomerOnboardingAnswers) => void;
  disabled?: boolean;
};

export function ImageUploadField({
  slug,
  token,
  kind,
  label,
  answers,
  onAnswersChange,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uploaded = listOnboardingImages(answers).filter((img) => img.kind === kind);

  const addPendingFiles = useCallback((files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (imageFiles.length === 0) {
      setError("Izberite veljavne slikovne datoteke.");
      return;
    }

    setError(null);
    setPending((current) => [
      ...current,
      ...imageFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }, []);

  function removePending(id: string) {
    setPending((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return current.filter((entry) => entry.id !== id);
    });
  }

  function removeUploaded(url: string) {
    onAnswersChange(removeOnboardingImage(answers, url));
  }

  async function persistAnswers(next: CustomerOnboardingAnswers) {
    const response = await fetch(`/api/onboarding/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, answers: next }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      throw new Error(data.error || "Shranjevanje slik ni uspelo");
    }
  }

  async function uploadPending() {
    if (pending.length === 0) {
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(
      pending.map((item) => ({
        fileName: item.file.name,
        status: "uploading",
      })),
    );

    try {
      const formData = new FormData();
      formData.set("token", token);
      formData.set("kind", kind);
      for (const item of pending) {
        formData.append("files", item.file);
      }

      const response = await fetch(`/api/onboarding/${slug}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        images?: OnboardingImage[];
        errors?: { fileName: string; error: string }[];
        error?: string;
      };

      if (!response.ok && !data.images?.length) {
        throw new Error(data.error || "Nalaganje ni uspelo");
      }

      const newImages: OnboardingImage[] = (data.images ?? []).map((img) => ({
        url: img.url,
        fileName: img.fileName,
        kind,
      }));

      if (newImages.length > 0) {
        const next = appendOnboardingImages(answers, newImages);
        onAnswersChange(next);
        await persistAnswers(next);
      }

      const apiErrors = data.errors ?? [];
      setProgress((current) =>
        current.map((item) => {
          const failed = apiErrors.find((entry) => entry.fileName === item.fileName);
          if (failed) {
            return { ...item, status: "error", error: failed.error };
          }
          return { ...item, status: "done" };
        }),
      );

      if (apiErrors.length > 0 && newImages.length === 0) {
        setError(apiErrors.map((entry) => entry.error).join("; "));
      } else if (apiErrors.length > 0) {
        setError(
          `Nekatere datoteke niso naložene: ${apiErrors.map((entry) => entry.fileName).join(", ")}`,
        );
      }

      setPending((current) => {
        for (const item of current) {
          URL.revokeObjectURL(item.previewUrl);
        }
        return [];
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nalaganje ni uspelo";
      setError(message);
      setProgress((current) =>
        current.map((item) => ({ ...item, status: "error", error: message })),
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-zinc-300">{label}</span>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (!disabled && event.dataTransfer.files.length) {
            addPendingFiles(event.dataTransfer.files);
          }
        }}
        className={`rounded-lg border border-dashed px-4 py-6 text-center transition ${
          dragOver
            ? "border-lime-300 bg-lime-300/10"
            : "border-white/20 bg-white/5"
        } ${disabled ? "opacity-60" : "cursor-pointer hover:border-white/30"}`}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.click();
          }
        }}
      >
        <p className="text-sm text-zinc-300">
          Povleci slike sem ali klikni za izbiro
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Več datotek hkrati · JPG, PNG, WebP, SVG · max 5 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={disabled || uploading}
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) {
              addPendingFiles(event.target.files);
              event.target.value = "";
            }
          }}
        />
      </div>

      {pending.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Izbrane datoteke ({pending.length})
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {pending.map((item) => (
              <li
                key={item.id}
                className="relative overflow-hidden rounded-lg border border-white/10 bg-black/20"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="aspect-square w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-[10px] text-zinc-200 truncate">
                  {item.file.name}
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removePending(item.id);
                  }}
                  className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/80"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={uploading || disabled}
            onClick={() => void uploadPending()}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-50"
          >
            {uploading ? "Nalagam…" : `Naloži ${pending.length} ${pending.length === 1 ? "sliko" : "slik"}`}
          </button>
        </div>
      ) : null}

      {progress.length > 0 ? (
        <ul className="space-y-1 text-xs text-zinc-400">
          {progress.map((item) => (
            <li key={item.fileName}>
              {item.status === "uploading" ? "⏳" : item.status === "done" ? "✓" : "✕"}{" "}
              {item.fileName}
              {item.error ? ` — ${item.error}` : null}
            </li>
          ))}
        </ul>
      ) : null}

      {uploaded.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Naloženo ({uploaded.length})
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {uploaded.map((image) => (
              <li
                key={image.url}
                className="relative overflow-hidden rounded-lg border border-white/10 bg-black/20"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.fileName ?? kind}
                  className="aspect-square w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-[10px] text-zinc-200 truncate">
                  {image.fileName ?? image.url.split("/").pop()}
                </div>
                {!disabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      removeUploaded(image.url);
                      void persistAnswers(removeOnboardingImage(answers, image.url));
                    }}
                    className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/80"
                  >
                    ✕
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
