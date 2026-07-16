"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarList } from "@/components/analytics/bar-list";
import { useT } from "@/lib/i18n/provider";
import type { getWeeklyDigest } from "@/lib/analytics";

type Digest = Awaited<ReturnType<typeof getWeeklyDigest>>;

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const up = delta >= 0;
  return (
    <span
      className={
        "ml-1.5 text-xs font-semibold " +
        (up ? "text-[var(--chart-2)]" : "text-destructive")
      }
    >
      {up ? "+" : ""}
      {delta}%
    </span>
  );
}

export function WeeklyDigest({ digest }: { digest: Digest }) {
  const { dict } = useT();
  const { kpis, topByClicks, topByViews, referrers } = digest;
  const hasAny = kpis.pageViews.value > 0 || kpis.productViews.value > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.digest.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{dict.digest.subtitle}</p>
      </CardHeader>
      <CardContent>
        {!hasAny ? (
          <p className="text-sm text-muted-foreground">{dict.digest.noData}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">
                  {dict.overview.pageViews}
                </span>
                <span className="tabular-nums">
                  {kpis.pageViews.value.toLocaleString()}
                  <DeltaBadge delta={kpis.pageViews.delta} />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">
                  {dict.overview.productViews}
                </span>
                <span className="tabular-nums">
                  {kpis.productViews.value.toLocaleString()}
                  <DeltaBadge delta={kpis.productViews.delta} />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">
                  {dict.overview.productClicks}
                </span>
                <span className="tabular-nums">
                  {kpis.productClicks.value.toLocaleString()}
                  <DeltaBadge delta={kpis.productClicks.delta} />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">
                  {dict.analytics.clickThrough}
                </span>
                <span className="tabular-nums">
                  {kpis.ctr.value}%
                  <DeltaBadge delta={kpis.ctr.delta} />
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {dict.digest.topClicked}
                </p>
                <BarList
                  items={topByClicks.map((p) => ({ label: p.name, count: p.clicks }))}
                />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {dict.digest.topViewed}
                </p>
                <BarList
                  items={topByViews.map((p) => ({ label: p.name, count: p.views }))}
                />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {dict.digest.topReferrers}
                </p>
                <BarList
                  items={referrers.map((r) => ({ label: r.source, count: r.count }))}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
