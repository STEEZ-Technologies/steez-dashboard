"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  deltaSuffix = "%",
  spark,
}: {
  label: string;
  value: number | string;
  delta: number | null;
  deltaSuffix?: string;
  spark?: number[];
}) {
  const up = delta != null && delta >= 0;
  const data = (spark ?? []).map((v, i) => ({ i, v }));
  const gid = `spark-${label.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <p className="eyebrow">{label}</p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="text-3xl font-extrabold tracking-tight tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {delta != null && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
                up
                  ? "bg-[color-mix(in_oklch,var(--chart-2),transparent_82%)] text-[color-mix(in_oklch,var(--chart-2),black_10%)] dark:text-chart-2"
                  : "bg-destructive/12 text-destructive",
              )}
            >
              {up ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {Math.abs(delta)}
              {deltaSuffix}
            </span>
          )}
        </div>
        {data.length > 1 && (
          <div className="mt-3 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  fill={`url(#${gid})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
