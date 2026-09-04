"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/ui/button";
import type { SmsStep } from "@/outreach/sms/types";

type ActionState = {
  loading: boolean;
  message: string | null;
  error: string | null;
};

function useActionState(): [ActionState, (patch: Partial<ActionState>) => void] {
  const [state, setState] = useState<ActionState>({
    loading: false,
    message: null,
    error: null,
  });
  return [state, (patch) => setState((prev) => ({ ...prev, ...patch }))];
}

export function AdminQueueSmsButton({
  slug,
  dueStep,
  canQueue,
  reason,
}: {
  slug: string;
  dueStep: SmsStep | null;
  canQueue: boolean;
  reason?: string | null;
}) {
  const router = useRouter();
  const [state, setState] = useActionState();
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  async function handleClick() {
    if (!canQueue) {
      setBlockedReason(reason || "Cannot queue SMS");
      return;
    }
    setBlockedReason(null);
    setState({ loading: true, message: null, error: null });
    try {
      const response = await fetch("/api/admin/outreach/sms/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, step: dueStep ?? "initial" }),
      });
      const data = (await response.json()) as { error?: string; messageId?: string };
      if (!response.ok) {
        throw new Error(data.error || "Queue failed");
      }
      setState({ loading: false, message: `Queued ${data.messageId}` });
      router.refresh();
    } catch (err) {
      setState({
        loading: false,
        error: err instanceof Error ? err.message : "Queue failed",
      });
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        variant="success"
        size="sm"
        disabled={state.loading}
        onClick={() => void handleClick()}
      >
        {state.loading ? "Queuing…" : "Queue SMS"}
      </Button>
      {blockedReason ? (
        <p className="text-xs text-[var(--admin-muted)]">{blockedReason}</p>
      ) : null}
      {state.message ? (
        <p className="text-xs text-emerald-400">{state.message}</p>
      ) : null}
      {state.error ? <p className="text-xs text-red-400">{state.error}</p> : null}
    </div>
  );
}

export function AdminRetrySmsButton({
  slug,
  dueStep,
  canRetry,
  lastFailedMessageId,
}: {
  slug: string;
  dueStep: SmsStep | null;
  canRetry: boolean;
  lastFailedMessageId?: string | null;
}) {
  const router = useRouter();
  const [state, setState] = useActionState();

  async function handleClick() {
    setState({ loading: true, message: null, error: null });
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
      const data = (await response.json()) as { error?: string; messageId?: string };
      if (!response.ok) {
        throw new Error(data.error || "Retry failed");
      }
      setState({ loading: false, message: `Retry queued ${data.messageId}` });
      router.refresh();
    } catch (err) {
      setState({
        loading: false,
        error: err instanceof Error ? err.message : "Retry failed",
      });
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        variant="secondary"
        size="sm"
        disabled={state.loading || !canRetry}
        onClick={() => void handleClick()}
      >
        Retry SMS
      </Button>
      {state.message ? (
        <p className="text-xs text-emerald-400">{state.message}</p>
      ) : null}
      {state.error ? <p className="text-xs text-red-400">{state.error}</p> : null}
    </div>
  );
}

export function AdminApproveButton({
  slug,
  canApprove,
}: {
  slug: string;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useActionState();

  async function handleClick() {
    setState({ loading: true, message: null, error: null });
    try {
      const response = await fetch(`/api/admin/onboarding/${slug}/approve`, {
        method: "POST",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Approval failed");
      }
      setState({ loading: false, message: "Approved" });
      router.refresh();
    } catch (err) {
      setState({
        loading: false,
        error: err instanceof Error ? err.message : "Approval failed",
      });
    }
  }

  if (!canApprove) {
    return null;
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        variant="default"
        size="sm"
        disabled={state.loading}
        onClick={() => void handleClick()}
      >
        {state.loading ? "Approving…" : "Approve onboarding"}
      </Button>
      {state.message ? (
        <p className="text-xs text-emerald-400">{state.message}</p>
      ) : null}
      {state.error ? <p className="text-xs text-red-400">{state.error}</p> : null}
    </div>
  );
}

export function AdminRetryPublishButton({
  slug,
  canRetry,
}: {
  slug: string;
  canRetry: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useActionState();

  async function handleClick() {
    setState({ loading: true, message: null, error: null });
    try {
      const response = await fetch(
        `/api/admin/onboarding/${slug}/retry-publish`,
        { method: "POST" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Retry failed");
      }
      setState({ loading: false, message: "Publish dispatched" });
      router.refresh();
    } catch (err) {
      setState({
        loading: false,
        error: err instanceof Error ? err.message : "Retry failed",
      });
    }
  }

  if (!canRetry) {
    return null;
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        variant="destructive"
        size="sm"
        disabled={state.loading}
        onClick={() => void handleClick()}
      >
        {state.loading ? "Dispatching…" : "Retry publish"}
      </Button>
      {state.message ? (
        <p className="text-xs text-emerald-400">{state.message}</p>
      ) : null}
      {state.error ? <p className="text-xs text-red-400">{state.error}</p> : null}
    </div>
  );
}

export function AdminCopyLinkButton({ url, label = "Copy link" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        void navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}

export function AdminFactoryDispatchButton() {
  const router = useRouter();
  const [state, setState] = useActionState();

  async function handleClick() {
    setState({ loading: true, message: null, error: null });
    try {
      const response = await fetch("/api/admin/factory/dispatch", {
        method: "POST",
      });
      const data = (await response.json()) as {
        error?: string;
        dispatched?: boolean;
        reason?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Dispatch failed");
      }
      setState({
        loading: false,
        message: data.dispatched ? "Worker dispatched" : (data.reason ?? "Not dispatched"),
      });
      router.refresh();
    } catch (err) {
      setState({
        loading: false,
        error: err instanceof Error ? err.message : "Dispatch failed",
      });
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        variant="default"
        size="sm"
        disabled={state.loading}
        onClick={() => void handleClick()}
      >
        {state.loading ? "Dispatching…" : "Dispatch worker"}
      </Button>
      {state.message ? (
        <p className="text-xs text-emerald-400">{state.message}</p>
      ) : null}
      {state.error ? <p className="text-xs text-red-400">{state.error}</p> : null}
    </div>
  );
}

export function AdminCleanupLocksButton() {
  const router = useRouter();
  const [state, setState] = useActionState();

  async function handleClick() {
    setState({ loading: true, message: null, error: null });
    try {
      const response = await fetch("/api/admin/factory/cleanup-locks", {
        method: "POST",
      });
      const data = (await response.json()) as {
        error?: string;
        removed?: number;
        staleFailedRemoved?: number;
      };
      if (!response.ok) {
        throw new Error(data.error || "Cleanup failed");
      }
      setState({
        loading: false,
        message: `Removed ${data.removed ?? 0} stale generating locks${data.staleFailedRemoved ? ` and ${data.staleFailedRemoved} stale failed locks` : ""}`,
      });
      router.refresh();
    } catch (err) {
      setState({
        loading: false,
        error: err instanceof Error ? err.message : "Cleanup failed",
      });
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        variant="secondary"
        size="sm"
        disabled={state.loading}
        onClick={() => void handleClick()}
      >
        {state.loading ? "Cleaning…" : "Cleanup stale locks"}
      </Button>
      {state.message ? (
        <p className="text-xs text-emerald-400">{state.message}</p>
      ) : null}
      {state.error ? <p className="text-xs text-red-400">{state.error}</p> : null}
    </div>
  );
}
