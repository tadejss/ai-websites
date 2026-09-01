"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function RevenueFunnelChart({
  funnel,
}: {
  funnel: {
    published: number;
    viewed: number;
    purchased: number;
    live: number;
  };
}) {
  const data = [
    { stage: "Published", count: funnel.published },
    { stage: "Viewed", count: funnel.viewed },
    { stage: "Purchased", count: funnel.purchased },
    { stage: "Live", count: funnel.live },
  ];

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="stage"
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
          <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
