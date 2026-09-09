"use client";

import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
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
    // BarChart sets `aspect-ratio` inline and takes no `style`. A definite
    // height on the wrapper (plus h-full) makes the browser ignore it.
    <div style={{ height }}>
      <BarChart
        data={data}
        xDataKey="name"
        orientation="horizontal"
        className="h-full"
        margin={{ left: 140, right: 12 }}
      >
        <Grid vertical />
        <Bar animate={false} dataKey={dataKey} fill={color} lineCap="round" />
        <BarYAxis showAllLabels />
        <ChartTooltip
          showCrosshair={false}
          rows={(point) => [
            {
              color,
              label: seriesName ?? dataKey,
              value: Number(point[dataKey] ?? 0),
            },
          ]}
        />
      </BarChart>
    </div>
  );
}
