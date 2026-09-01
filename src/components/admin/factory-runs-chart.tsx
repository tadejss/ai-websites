"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Run = {
  runId: string;
  startedAt: string;
  demosGenerated: number;
  demosPublished: number;
  status: string;
};

export function FactoryRunsSparkline({ runs }: { runs: Run[] }) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const data = [...runs]
    .filter((run) => new Date(run.startedAt).getTime() >= cutoff)
    .reverse()
    .map((run) => ({
      time: new Date(run.startedAt).toLocaleTimeString("sl-SI", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      generated: run.demosGenerated,
      published: run.demosPublished,
    }));

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--admin-muted)]">
        No runs in the last 24 hours
      </p>
    );
  }

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="time"
            tick={{ fill: "#71717a", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          />
          <Tooltip
            contentStyle={{
              background: "#111113",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="generated"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="published"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
