"use client";

import { useMemo } from "react";
import { curveMonotoneX } from "@visx/curve";
import { AreaChart } from "@/components/charts/area-chart";
import { Area } from "@/components/charts/area";
import { Grid } from "@/components/charts/grid";
import { XAxis } from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import { ChartTooltip } from "@/components/charts/tooltip";
import {
  Legend,
  LegendItem,
  LegendMarker,
  LegendLabel,
  LegendValue,
} from "@/components/charts/legend";
import { useT } from "@/lib/i18n/provider";

export function ViewsClicksChart({
  data,
  height = 260,
}: {
  data: { date: string; views: number; clicks: number }[];
  height?: number;
}) {
  const { dict } = useT();

  // bklit's time-series scale wants real Dates on the x key.
  const chartData = useMemo(
    () => data.map((d) => ({ ...d, date: new Date(d.date) })),
    [data],
  );

  // The two lines are only named in the tooltip, and there is no hover on
  // touch devices — so the legend carries the labels and range totals.
  const legendItems = useMemo(
    () => [
      {
        label: dict.overview.productViews,
        value: data.reduce((sum, d) => sum + d.views, 0),
        color: "var(--chart-1)",
      },
      {
        label: dict.overview.productClicks,
        value: data.reduce((sum, d) => sum + d.clicks, 0),
        color: "var(--chart-2)",
      },
    ],
    [data, dict.overview.productViews, dict.overview.productClicks],
  );

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        {dict.analytics.noActivity}
      </div>
    );
  }

  return (
    <div>
      {/* `style` wins over AreaChart's default aspectRatio, so the caller's
          fixed `height` still drives the box. */}
      <AreaChart data={chartData} style={{ height, aspectRatio: "auto" }}>
        <Grid horizontal />
        <Area
          animate={false}
          dataKey="views"
          curve={curveMonotoneX}
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Area
          animate={false}
          dataKey="clicks"
          curve={curveMonotoneX}
          stroke="var(--chart-2)"
          fill="var(--chart-2)"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <XAxis />
        <YAxis />
        <ChartTooltip
          rows={(point) => [
            {
              color: "var(--chart-1)",
              label: dict.overview.productViews,
              value: Number(point.views ?? 0),
            },
            {
              color: "var(--chart-2)",
              label: dict.overview.productClicks,
              value: Number(point.clicks ?? 0),
            },
          ]}
        />
      </AreaChart>

      <Legend items={legendItems} className="mt-3 flex-row flex-wrap gap-x-4">
        <LegendItem className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <LegendMarker />
          <LegendLabel />
          <LegendValue />
        </LegendItem>
      </Legend>
    </div>
  );
}
