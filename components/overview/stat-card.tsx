"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { curveMonotoneX } from "@visx/curve";
import { AreaChart } from "@/components/charts/area-chart";
import { Area } from "@/components/charts/area";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTip } from "@/components/shared/info-tip";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  deltaSuffix = "%",
  spark,
  info,
}: {
  label: string;
  value: number | string;
  delta: number | null;
  deltaSuffix?: string;
  spark?: number[];
  info?: string;
}) {
  const up = delta != null && delta >= 0;
  const data = (spark ?? []).map((v, i) => ({ i, v }));

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <p className="eyebrow">
          {label}
          {info && <InfoTip text={info} label={label} className="ml-1 align-[-2px]" />}
        </p>
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
          <div className="mt-3">
            <AreaChart
              data={data}
              xDataKey="i"
              margin={{ top: 2, bottom: 2, left: 0, right: 0 }}
              style={{ height: 40, aspectRatio: "auto" }}
            >
              <Area
                animate={false}
                dataKey="v"
                curve={curveMonotoneX}
                stroke="var(--chart-2)"
                fill="var(--chart-2)"
                fillOpacity={0.35}
                strokeWidth={2}
                showHighlight={false}
              />
            </AreaChart>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
