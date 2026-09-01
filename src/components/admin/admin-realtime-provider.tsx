"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { HealthPayload } from "@/components/admin/admin-health-strip";

type RealtimeContext = {
  health: HealthPayload | null;
  queueCounts: Record<string, number> | null;
  critical: boolean;
};

const AdminRealtimeContext = createContext<RealtimeContext>({
  health: null,
  queueCounts: null,
  critical: false,
});

export function useAdminRealtime() {
  return useContext(AdminRealtimeContext);
}

export function AdminRealtimeProvider({
  children,
  initialHealth,
}: {
  children: React.ReactNode;
  initialHealth: HealthPayload;
}) {
  const [health, setHealth] = useState<HealthPayload>(initialHealth);
  const [queueCounts, setQueueCounts] = useState<Record<string, number> | null>(
    null,
  );
  const [critical, setCritical] = useState(false);

  useEffect(() => {
    const source = new EventSource("/api/admin/stream");

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          type: string;
          health?: HealthPayload;
          queueCounts?: Record<string, number>;
          critical?: boolean;
        };
        if (data.health) {
          setHealth(data.health);
        }
        if (data.queueCounts) {
          setQueueCounts(data.queueCounts);
        }
        if (data.critical !== undefined) {
          setCritical(data.critical);
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => source.close();
  }, []);

  return (
    <AdminRealtimeContext.Provider value={{ health, queueCounts, critical }}>
      {children}
    </AdminRealtimeContext.Provider>
  );
}
