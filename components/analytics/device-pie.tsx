"use client";

import { useState } from "react";
import { PieChart } from "@/components/charts/pie-chart";
import { PieSlice } from "@/components/charts/pie-slice";
import { PieCenter } from "@/components/charts/pie-center";
import {
  Legend,
  LegendItem,
  LegendMarker,
  LegendLabel,
  LegendValue,
} from "@/components/charts/legend";
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
  // Hover is lifted so the legend and the slices highlight together.
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  const slices = data.map((d, i) => ({
    label: deviceLabel(d.device),
    value: d.count,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="flex flex-col items-center gap-4">
      <PieChart
        data={slices}
        size={height}
        innerRadius={52}
        padAngle={0.03}
        cornerRadius={4}
        hoveredIndex={hoveredIndex}
        onHoverChange={setHoveredIndex}
      >
        {slices.map((s, i) => (
          <PieSlice animate={false} index={i} key={s.label} color={s.color} />
        ))}
        <PieCenter defaultLabel={dict.analytics.devices} />
      </PieChart>

      <Legend
        items={slices}
        hoveredIndex={hoveredIndex}
        onHoverChange={setHoveredIndex}
        className="flex-row flex-wrap justify-center gap-x-4"
      >
        <LegendItem className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <LegendMarker />
          <LegendLabel />
          <LegendValue />
        </LegendItem>
      </Legend>
    </div>
  );
}
