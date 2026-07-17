"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useT } from "@/lib/i18n/provider";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

export function DevicePie({
  data,
  height = 240,
}: {
  data: { device: string; count: number }[];
  height?: number;
}) {
  const { dict } = useT();
  const deviceLabel = (device: string) =>
    device === "Desktop"
      ? dict.analytics.deviceDesktop
      : device === "Mobile"
        ? dict.analytics.deviceMobile
        : device === "Tablet"
          ? dict.analytics.deviceTablet
          : device;

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

  const translated = data.map((d) => ({ ...d, deviceLabel: deviceLabel(d.device) }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={translated}
          dataKey="count"
          nameKey="deviceLabel"
          innerRadius={52}
          outerRadius={82}
          paddingAngle={2}
          stroke="var(--card)"
          strokeWidth={2}
          isAnimationActive={false}
        >
          {translated.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            fontSize: 13,
          }}
        />
        <Legend
          iconType="circle"
          formatter={(v) => <span className="text-sm text-muted-foreground">{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
