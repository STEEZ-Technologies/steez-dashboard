"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useT } from "@/lib/i18n/provider";

export function RankBarChart({
  data,
  dataKey,
  seriesName,
  color = "var(--chart-1)",
  height = 260,
}: {
  data: { name: string; [k: string]: string | number }[];
  dataKey: string;
  seriesName?: string;
  color?: string;
  height?: number;
}) {
  const { dict } = useT();

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        {dict.digest.noData}
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          stroke="var(--border)"
        />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          stroke="var(--border)"
        />
        <Tooltip
          cursor={{ fill: "color-mix(in oklch, var(--chart-2), transparent 90%)" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            fontSize: 13,
          }}
        />
        <Bar
          dataKey={dataKey}
          name={seriesName}
          fill={color}
          radius={[0, 6, 6, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
