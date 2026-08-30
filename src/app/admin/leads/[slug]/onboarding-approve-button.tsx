"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  slug: string;
  canApprove: boolean;
  isApproved: boolean;
};

export function AdminOnboardingApproveButton({
  slug,
  canApprove,
  isApproved,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isApproved) {
    return (
      <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
        ✓ Potrjeno — pripravljeno za objavo
      </div>
    );
  }

  if (!canApprove) {
    return null;
  }

  async function handleApprove() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/onboarding/${slug}/approve`, {
        method: "POST",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Potrditev ni uspela");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Potrditev ni uspela");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleApprove()}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "Potrjujem…" : "Potrdi in pripravi za objavo"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
