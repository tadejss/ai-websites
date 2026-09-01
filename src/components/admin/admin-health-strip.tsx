"use client";

import { useEffect, useState } from "react";
import { StatusIndicator } from "@/components/admin/ui/status-led";

type HealthPayload = {
  factory: { level: "ok" | "warning" | "failed" | "idle"; detail: string };
  sms: { level: "ok" | "warning" | "failed" | "idle"; detail: string };
  gateway: { level: "ok" | "warning" | "failed" | "idle"; detail: string };
  dispatch: { level: "ok" | "warning" | "failed" | "idle"; detail: string };
};

export function AdminHealthStrip({ initial }: { initial: HealthPayload }) {
  const [health, setHealth] = useState(initial);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/admin/health");
        if (response.ok) {
          const data = (await response.json()) as HealthPayload;
          setHealth(data);
        }
      } catch {
        // ignore polling errors
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-[var(--admin-border)] bg-[var(--admin-bg)] px-4 py-2">
      <StatusIndicator
        label="Factory"
        level={health.factory.level}
        detail={health.factory.detail}
        pulse={health.factory.level === "ok"}
      />
      <StatusIndicator
        label="SMS"
        level={health.sms.level}
        detail={health.sms.detail}
      />
      <StatusIndicator
        label="Gateway"
        level={health.gateway.level}
        detail={health.gateway.detail}
      />
      <StatusIndicator
        label="Dispatch"
        level={health.dispatch.level}
        detail={health.dispatch.detail}
      />
    </div>
  );
}

export type { HealthPayload };
