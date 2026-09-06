"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AdminAction } from "@/admin/entity";
import { formatAdminDate } from "@/components/admin/admin-page";
import { AdminActionDispatcher } from "@/components/admin/admin-action-dispatcher";
import { Button } from "@/components/admin/ui/button";
import {
  ACTIVATING_STATUSES,
  type CustomerDomainRecord,
  type EmailMailboxRecord,
  type EmailServiceRecord,
} from "@/email/types";

type Props = {
  slug: string;
  purchasedProfessionalEmail: boolean;
  emailDomain: CustomerDomainRecord | null;
  emailService: EmailServiceRecord | null;
  emailMailbox: EmailMailboxRecord | null;
  actions: AdminAction[];
};

export function EntityEmailCard({
  slug,
  purchasedProfessionalEmail,
  emailDomain,
  emailService,
  emailMailbox,
  actions,
}: Props) {
  const router = useRouter();
  const [domainInput, setDomainInput] = useState(emailDomain?.domain ?? "");
  const [pending, setPending] = useState<"set-domain" | "initialize" | null>(
    null,
  );

  const effectiveDomain =
    emailDomain && emailDomain.status !== "cancelled" ? emailDomain : null;

  async function postJson(
    label: string,
    url: string,
    body?: Record<string, unknown>,
  ) {
    const response = await fetch(url, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      throw new Error(data.error || `${label} failed`);
    }
    toast.success(label);
    router.refresh();
  }

  async function onInitialize() {
    if (pending) return;
    setPending("initialize");
    try {
      await postJson(
        "Initialize email service",
        `/api/admin/email/${slug}/initialize-service`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Initialize failed",
      );
    } finally {
      setPending(null);
    }
  }

  async function onSetDomain() {
    if (pending || !domainInput.trim()) return;
    setPending("set-domain");
    try {
      await postJson("Set domain", `/api/admin/email/${slug}/set-domain`, {
        domain: domainInput.trim(),
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Set domain failed",
      );
    } finally {
      setPending(null);
    }
  }

  if (!purchasedProfessionalEmail) {
    return (
      <p className="text-sm text-[var(--admin-muted)]">
        Professional email not purchased
      </p>
    );
  }

  if (!emailService) {
    return (
      <div className="space-y-3 text-sm">
        <p>
          Professional email · Purchased — email service not initialized
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending !== null}
          onClick={() => void onInitialize()}
        >
          {pending === "initialize"
            ? "Initializing…"
            : "Initialize email service"}
        </Button>
      </div>
    );
  }

  const isActivating = ACTIVATING_STATUSES.includes(emailService.status);
  const showSetDomain =
    !effectiveDomain &&
    (emailService.status === "waiting_for_domain" ||
      emailService.status === "not_requested");
  const showActivate =
    effectiveDomain?.status === "pending" &&
    (emailService.status === "waiting_for_domain" ||
      emailService.status === "not_requested" ||
      emailService.status === "pending");

  const emailActions = actions.filter((action) => {
    if (action.kind === "activate_domain") {
      return showActivate;
    }
    if (action.kind === "retry_email_provision") {
      return emailService.status === "failed";
    }
    if (action.kind === "resend_email_credentials") {
      return emailService.status === "active";
    }
    return false;
  });

  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-[var(--admin-muted)]">
        Professional email · Purchased
      </p>
      <dl className="grid gap-1">
        <div>
          Domain:{" "}
          {effectiveDomain
            ? `${effectiveDomain.domain} (${effectiveDomain.status})`
            : "—"}
        </div>
        <div>Mailbox: {emailMailbox?.emailAddress ?? "—"}</div>
        <div>Provider: {emailService.provider}</div>
        <div>Status: {emailService.status}</div>
        {emailService.provisioningStep ? (
          <div>Step: {emailService.provisioningStep}</div>
        ) : null}
        <div>
          Stripe sub: {emailService.stripeSubscriptionId ?? "—"}
        </div>
        <div>Created: {formatAdminDate(emailService.createdAt)}</div>
      </dl>

      {emailService.lastError ? (
        <p className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-400">
          {emailService.lastError}
        </p>
      ) : null}

      {showSetDomain ? (
        <div className="space-y-2">
          <p className="text-xs text-[var(--admin-muted)]">
            Waiting for domain — set the custom domain, then Activate domain.
          </p>
          <label className="block">
            <span className="text-xs text-[var(--admin-muted)]">
              Email domain
            </span>
            <input
              type="text"
              value={domainInput}
              onChange={(event) => setDomainInput(event.target.value)}
              placeholder="npr. primer.si"
              disabled={pending !== null}
              className="mt-1 w-full rounded-lg border border-[var(--admin-border)] bg-transparent px-3 py-2 text-sm"
            />
          </label>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending !== null || !domainInput.trim()}
            onClick={() => void onSetDomain()}
          >
            {pending === "set-domain" ? "Saving…" : "Set domain"}
          </Button>
        </div>
      ) : null}

      {effectiveDomain?.status === "pending" &&
      emailService.status === "waiting_for_domain" ? (
        <p className="text-xs text-[var(--admin-muted)]">
          Domain is pending — Activate domain when ready for provisioning.
        </p>
      ) : null}

      {isActivating ? (
        <p className="text-xs text-[var(--admin-muted)]">
          Provisioning in progress ({emailService.status}
          {emailService.provisioningStep
            ? ` · ${emailService.provisioningStep}`
            : ""}
          ).
        </p>
      ) : null}

      {emailService.status === "suspended" ||
      emailService.status === "cancelled" ? (
        <p className="text-xs text-[var(--admin-muted)]">
          Service is {emailService.status}.
        </p>
      ) : null}

      {emailActions.length > 0 ? (
        <AdminActionDispatcher
          slug={slug}
          actions={emailActions}
          layout="inline"
        />
      ) : null}
    </div>
  );
}
