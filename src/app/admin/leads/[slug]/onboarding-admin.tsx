"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OnboardingStatus } from "@/onboarding/types";
import { canRetryCustomerPublish } from "@/onboarding/types";

type Props = {
  url: string;
};

export function AdminCopyOnboardingLink({ url }: Props) {
  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard.writeText(url)}
      className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
    >
      Copy onboarding link
    </button>
  );
}

type PublishPanelProps = {
  slug: string;
  status: OnboardingStatus;
  publishError?: string | null;
  publishedAt?: string | null;
  publishCommitSha?: string | null;
};

export function AdminCustomerPublishPanel({
  slug,
  status,
  publishError,
  publishedAt,
  publishCommitSha,
}: PublishPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "live") {
    return (
      <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <p className="font-medium">✓ LIVE na zbrendiraj.si/{slug}</p>
        {publishedAt ? (
          <p className="mt-1 text-xs text-emerald-800">
            Objavljeno: {new Date(publishedAt).toLocaleString("sl-SI")}
          </p>
        ) : null}
        {publishCommitSha ? (
          <p className="mt-0.5 font-mono text-xs text-emerald-800">
            {publishCommitSha.slice(0, 12)}
          </p>
        ) : null}
      </div>
    );
  }

  if (status === "publishing") {
    return (
      <div className="rounded-md border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Objavljanje v teku… (git push → Vercel)
      </div>
    );
  }

  if (status === "approved_for_publish") {
    return (
      <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Potrjeno — objava se izvaja v ozadju.
      </div>
    );
  }

  if (status === "publish_failed") {
    return (
      <div className="space-y-2">
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-medium">Objava ni uspela</p>
          {publishError ? (
            <p className="mt-1 whitespace-pre-wrap text-xs">{publishError}</p>
          ) : null}
        </div>
        <RetryPublishButton
          slug={slug}
          loading={loading}
          error={error}
          onRetry={async () => {
            setLoading(true);
            setError(null);
            try {
              const response = await fetch(
                `/api/admin/onboarding/${slug}/retry-publish`,
                { method: "POST" },
              );
              const data = (await response.json()) as { error?: string };
              if (!response.ok) {
                throw new Error(data.error || "Ponovitev objave ni uspela");
              }
              router.refresh();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Ponovitev objave ni uspela",
              );
            } finally {
              setLoading(false);
            }
          }}
        />
      </div>
    );
  }

  return null;
}

function RetryPublishButton({
  slug,
  loading,
  error,
  onRetry,
}: {
  slug: string;
  loading: boolean;
  error: string | null;
  onRetry: () => Promise<void>;
}) {
  if (!canRetryCustomerPublish("publish_failed")) {
    return null;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => void onRetry()}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {loading ? "Začenjam…" : "Ponovi objavo LIVE"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export function AdminPublishRetryButton({
  slug,
  status,
}: {
  slug: string;
  status: OnboardingStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canRetryCustomerPublish(status) || status === "publish_failed") {
    return null;
  }

  async function handleRetry() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/onboarding/${slug}/retry-publish`,
        { method: "POST" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Ponovitev objave ni uspela");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ponovitev objave ni uspela");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleRetry()}
        className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
      >
        {loading ? "Začenjam…" : "Ponovi objavo LIVE"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
