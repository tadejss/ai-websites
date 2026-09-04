"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import type { WebsiteDomainRecord } from "@/website-domains/types";

type Props = {
  slug: string;
  desiredDomain: string | null;
  domains: WebsiteDomainRecord[];
};

function statusVariant(
  status: WebsiteDomainRecord["status"],
): "success" | "warning" | "destructive" | "default" {
  switch (status) {
    case "live":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "destructive";
    default:
      return "default";
  }
}

export function WebsiteDomainPanel({ slug, desiredDomain, domains }: Props) {
  const router = useRouter();
  const [hostname, setHostname] = useState(desiredDomain ?? "");
  const [pending, setPending] = useState(false);

  async function publishLive() {
    if (pending) {
      return;
    }
    setPending(true);
    try {
      const response = await fetch(
        `/api/admin/onboarding/${slug}/website-domain`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostname }),
        },
      );
      const data = (await response.json()) as {
        error?: string;
        ok?: boolean;
      };
      if (!response.ok) {
        throw new Error(data.error || "Could not connect the domain.");
      }
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Custom domain connected");
      }
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not connect the domain.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 text-sm">
      {domains.length > 0 ? (
        <ul className="space-y-2">
          {domains.map((domain) => (
            <li
              key={domain.id}
              className="rounded border border-[var(--admin-border)] px-2 py-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {domain.hostname}
                  {domain.canonical ? (
                    <span className="ml-1 text-[var(--admin-muted)]">
                      (canonical)
                    </span>
                  ) : null}
                </span>
                <Badge variant={statusVariant(domain.status)}>
                  {domain.status}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
                {domain.kind}
                {domain.vercelVerified ? " · verified on Vercel" : ""}
              </p>
              {domain.vercelError ? (
                <p className="mt-1 text-xs text-red-400">{domain.vercelError}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[var(--admin-muted)]">
          DNS must already point at this project. Enter the hostname and publish
          live.
        </p>
      )}

      <label className="block">
        <span className="text-xs text-[var(--admin-muted)]">Custom domain</span>
        <input
          type="text"
          value={hostname}
          onChange={(event) => setHostname(event.target.value)}
          placeholder="npr. primer.si"
          disabled={pending}
          className="mt-1 w-full rounded-lg border border-[var(--admin-border)] bg-transparent px-3 py-2 text-sm"
        />
      </label>

      <Button
        type="button"
        size="sm"
        disabled={pending || !hostname.trim()}
        onClick={() => void publishLive()}
      >
        {pending ? "Connecting…" : "Objavi LIVE"}
      </Button>
    </div>
  );
}
