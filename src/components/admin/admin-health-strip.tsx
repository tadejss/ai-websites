"use client";

import { useEffect, useState } from "react";
import { StatusIndicator } from "@/components/admin/ui/status-led";
import { useAdminRealtime } from "@/components/admin/admin-realtime-provider";

type HealthPayload = {
  factory: { level: "ok" | "warning" | "failed" | "idle"; detail: string };
  sms: { level: "ok" | "warning" | "failed" | "idle"; detail: string };
  gateway: { level: "ok" | "warning" | "failed" | "idle"; detail: string };
  dispatch: { level: "ok" | "warning" | "failed" | "idle"; detail: string };
};

export function AdminHealthStrip({ initial }: { initial: HealthPayload }) {
  const realtime = useAdminRealtime();
  const [health, setHealth] = useState(initial);

  useEffect(() => {
    if (realtime.health) {
      setHealth(realtime.health);
    }
  }, [realtime.health]);

  const indicators = [
    {
      label: "Factory",
      level: health.factory.level,
      detail: health.factory.detail,
      pulse: health.factory.level === "ok",
    },
    {
      label: "SMS",
      level: health.sms.level,
      detail: health.sms.detail,
      pulse: false,
    },
    {
      label: "Gateway",
      level: health.gateway.level,
      detail: health.gateway.detail,
      pulse: false,
    },
    {
      label: "Dispatch",
      level: health.dispatch.level,
      detail: health.dispatch.detail,
      pulse: false,
    },
  ] as const;

  const criticalCount = realtime.queueCounts?.publish_failed ?? 0;

  return (
    <div className="border-b border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 md:px-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:flex md:flex-wrap md:items-center md:gap-x-6 md:gap-y-2">
        {indicators.map((item) => (
          <StatusIndicator
            key={item.label}
            label={item.label}
            level={item.level}
            detail={item.detail}
            pulse={item.pulse}
            compact
          />
        ))}
        {criticalCount > 0 ? (
          <span className="text-sm text-red-400">
            ⚠ {criticalCount} publish failed
          </span>
        ) : null}
      </div>
    </div>
  );
}

export type { HealthPayload };
