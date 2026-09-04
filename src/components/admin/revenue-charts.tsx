"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthlyPoint = {
  month: string;
  label: string;
  value: number;
};

export function RevenueMonthlyChart({
  data,
  valueLabel,
}: {
  data: MonthlyPoint[];
  valueLabel: string;
}) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: "#9a9a9a", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          />
          <YAxis
            tick={{ fill: "#9a9a9a", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value) => [String(value ?? 0), valueLabel]}
            contentStyle={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" fill="#c7ff3d" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
