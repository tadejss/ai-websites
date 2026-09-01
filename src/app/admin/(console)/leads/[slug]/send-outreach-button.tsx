"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OutreachStep } from "@/leads/outreach-types";

type Props = {
  slug: string;
  dueStep: OutreachStep | null;
  eligible: boolean;
};

export function SendOutreachButton({ slug, dueStep, eligible }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(step?: OutreachStep) {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, step }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        dryRun?: boolean;
        subject?: string;
        recipient?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Send failed");
        return;
      }

      setMessage(
        data.dryRun
          ? `Dry run: would send "${data.subject}" to ${data.recipient}`
          : `Sent "${data.subject}" to ${data.recipient}`,
      );

      if (!data.dryRun) {
        router.refresh();
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Send failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading || !eligible}
          onClick={() => send(dueStep ?? "initial")}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 disabled:opacity-50"
        >
          {loading ? "Sending…" : dueStep ? `Email: Send ${dueStep}` : "Email: Send initial"}
        </button>
      </div>

      {!eligible ? (
        <p className="text-xs text-neutral-500">
          Email outreach not eligible (missing email, website, or suppressed). Manual
          email remains available when eligible; automated outreach is SMS-only.
        </p>
      ) : (
        <p className="text-xs text-neutral-500">
          Manual email only — automated outreach uses SMS.
        </p>
      )}

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
