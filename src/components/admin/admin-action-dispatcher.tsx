"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AdminAction } from "@/admin/entity";
import {
  AdminApproveButton,
  AdminCopyLinkButton,
  AdminQueueSmsButton,
  AdminRetryPublishButton,
  AdminRetrySmsButton,
} from "@/components/admin/admin-actions";
import { Button } from "@/components/admin/ui/button";

type DispatcherProps = {
  slug: string;
  actions: AdminAction[];
  layout?: "row" | "inline";
  dueStep?: import("@/outreach/sms/types").SmsStep | null;
  lastFailedMessageId?: string | null;
  onboardingUrl?: string | null;
  demoUrl?: string;
  onSuccess?: () => void;
};

export function AdminActionDispatcher({
  slug,
  actions,
  layout = "row",
  dueStep = null,
  lastFailedMessageId = null,
  onboardingUrl = null,
  demoUrl,
  onSuccess,
}: DispatcherProps) {
  const router = useRouter();
  const className =
    layout === "inline"
      ? "flex flex-wrap items-center gap-1"
      : "flex flex-wrap gap-2";

  const actionMap = new Map(actions.map((action) => [action.kind, action]));

  async function runAction(
    label: string,
    url: string,
    method = "POST",
    body?: unknown,
  ): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || `${label} failed`);
      }
      toast.success(label);
      router.refresh();
      onSuccess?.();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${label} failed`);
      return false;
    }
  }

  function inlineButton(
    action: AdminAction,
    onClick: () => void,
    variant: "default" | "secondary" | "destructive" | "success" = "secondary",
  ) {
    return (
      <Button
        key={action.kind}
        variant={variant}
        size="sm"
        disabled={!action.enabled}
        onClick={() => void onClick()}
        title={action.reason ?? undefined}
      >
        {action.label}
      </Button>
    );
  }

  if (layout === "inline") {
    return (
      <div className={className}>
        {actionMap.get("retry_publish")?.enabled
          ? inlineButton(
              actionMap.get("retry_publish")!,
              () =>
                void runAction(
                  "Publish dispatched",
                  `/api/admin/onboarding/${slug}/retry-publish`,
                ),
              "destructive",
            )
          : null}
        {actionMap.get("approve_onboarding")?.enabled
          ? inlineButton(
              actionMap.get("approve_onboarding")!,
              () =>
                void runAction(
                  "Approved",
                  `/api/admin/onboarding/${slug}/approve`,
                ),
              "default",
            )
          : null}
        {actionMap.get("queue_sms")?.enabled
          ? inlineButton(
              actionMap.get("queue_sms")!,
              () =>
                void runAction("SMS queued", "/api/admin/outreach/sms/queue", "POST", {
                  slug,
                  step: dueStep ?? "initial",
                }),
              "success",
            )
          : null}
        {actionMap.get("open_demo") && demoUrl ? (
          <a
            href={demoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center rounded-md border border-[var(--admin-border)] px-2 text-xs text-cyan-400 hover:bg-[var(--admin-surface-elevated)]"
          >
            Demo ↗
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className}>
      {actionMap.get("queue_sms") ? (
        <AdminQueueSmsButton
          slug={slug}
          dueStep={dueStep}
          canQueue={actionMap.get("queue_sms")!.enabled}
          reason={actionMap.get("queue_sms")!.reason}
        />
      ) : null}
      {actionMap.get("retry_sms") ? (
        <AdminRetrySmsButton
          slug={slug}
          dueStep={dueStep}
          canRetry={actionMap.get("retry_sms")!.enabled}
          lastFailedMessageId={lastFailedMessageId}
        />
      ) : null}
      {actionMap.get("approve_onboarding") ? (
        <AdminApproveButton
          slug={slug}
          canApprove={actionMap.get("approve_onboarding")!.enabled}
        />
      ) : null}
      {actionMap.get("retry_publish") ? (
        <AdminRetryPublishButton
          slug={slug}
          canRetry={actionMap.get("retry_publish")!.enabled}
        />
      ) : null}
      {actionMap.get("copy_onboarding_link")?.enabled && onboardingUrl ? (
        <AdminCopyLinkButton url={onboardingUrl} label="Copy onboarding" />
      ) : null}
      {actionMap.get("open_demo")?.enabled && demoUrl ? (
        <a
          href={demoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center rounded-md border border-[var(--admin-border)] px-3 text-xs text-cyan-400 hover:bg-[var(--admin-surface-elevated)]"
        >
          Open demo ↗
        </a>
      ) : null}
      {actionMap.get("activate_domain")?.enabled
        ? inlineButton(
            actionMap.get("activate_domain")!,
            () =>
              void runAction(
                "Domain activated",
                `/api/admin/email/${slug}/activate-domain`,
              ),
            "default",
          )
        : null}
      {actionMap.get("retry_email_provision")?.enabled
        ? inlineButton(
            actionMap.get("retry_email_provision")!,
            () =>
              void runAction(
                "Email provisioning queued",
                `/api/admin/email/${slug}/retry-provision`,
              ),
            "destructive",
          )
        : null}
      {actionMap.get("resend_email_credentials")?.enabled
        ? inlineButton(
            actionMap.get("resend_email_credentials")!,
            () =>
              void runAction(
                "Credentials sent",
                `/api/admin/email/${slug}/resend-credentials`,
              ),
            "secondary",
          )
        : null}
    </div>
  );
}
