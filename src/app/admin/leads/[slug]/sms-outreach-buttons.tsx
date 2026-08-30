"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SmsStep } from "@/outreach/sms/types";

type Props = {
  slug: string;
  dueStep: SmsStep | null;
  canQueue: boolean;
  canRetry: boolean;
  lastFailedMessageId?: string | null;
  ineligibilityReason?: string | null;
};

export function SmsOutreachButtons({
  slug,
  dueStep,
  canQueue,
  canRetry,
  lastFailedMessageId,
  ineligibilityReason,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function queueSms(step?: SmsStep) {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/outreach/sms/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, step: step ?? dueStep ?? "initial" }),
      });
      const data = (await response.json()) as {
        error?: string;
        messageId?: string;
        body?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Queue failed");
      }
      setMessage(`Queued ${data.messageId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Queue failed");
    } finally {
      setLoading(false);
    }
  }

  async function retryFailed() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/outreach/sms/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          lastFailedMessageId
            ? { messageId: lastFailedMessageId }
            : { slug, step: dueStep ?? "initial" },
        ),
      });
      const data = (await response.json()) as {
        error?: string;
        messageId?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Retry failed");
      }
      setMessage(`Retry queued ${data.messageId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading || !canQueue}
          onClick={() => void queueSms()}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Queuing…" : "Queue SMS"}
        </button>
        <button
          type="button"
          disabled={loading || !canRetry}
          onClick={() => void retryFailed()}
          className="rounded-md border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 disabled:opacity-50"
        >
          Retry failed
        </button>
      </div>
      {!canQueue ? (
        <p className="text-xs text-neutral-500">
          SMS cannot be queued
          {ineligibilityReason ? `: ${ineligibilityReason}` : "."}
        </p>
      ) : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
