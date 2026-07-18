import Link from "next/link";
import { getTenantFromSession } from "@/lib/tenant";
import {
  getKpis,
  getViewsVsClicksByDay,
  getTopProductsByViews,
  getTopProductsByClicks,
  getTopFinishes,
  getTopReferrers,
  getDeviceBreakdown,
  getRecentActivity,
  getTopCountries,
  getProductPerformance,
  zeroViewProducts,
  viewedNotClickedProducts,
} from "@/lib/analytics";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/overview/stat-card";
import { LinkButton } from "@/components/ui/link-button";
import { RangeTabs } from "@/components/analytics/range-tabs";
import { ViewsClicksChart } from "@/components/analytics/views-clicks-chart";
import { RankBarChart } from "@/components/analytics/rank-bar-chart";
import { BarList } from "@/components/analytics/bar-list";
import { DevicePie } from "@/components/analytics/device-pie";
import { ActivityFeed } from "@/components/analytics/activity-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";

const ALLOWED = new Set(["7", "30", "90"]);

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { tenantId } = await getTenantFromSession();
  const dict = await getDictionary();
  const sp = await searchParams;
  const rangeStr = sp.range && ALLOWED.has(sp.range) ? sp.range : "30";
  const days = Number(rangeStr);

  const [
    kpis,
    series,
    byViews,
    byClicks,
    finishes,
    referrers,
    devices,
    countries,
    activity,
    performance,
  ] = await Promise.all([
    getKpis(tenantId, days),
    getViewsVsClicksByDay(tenantId, days),
    getTopProductsByViews(tenantId, days),
    getTopProductsByClicks(tenantId, days),
    getTopFinishes(tenantId, days),
    getTopReferrers(tenantId, days),
    getDeviceBreakdown(tenantId, days),
    getTopCountries(tenantId, days),
    getRecentActivity(tenantId, 12),
    getProductPerformance(tenantId, days),
  ]);

  const noViews = zeroViewProducts(performance);
  const noClicks = viewedNotClickedProducts(performance);

  return (
    <div>
      <PageHeader
        eyebrow={dict.pages.analytics.eyebrow}
        title={dict.pages.analytics.title}
        description={dict.analytics.lastDays.replace("{days}", String(days))}
        action={
          <div className="flex items-center gap-2">
            <LinkButton
              variant="outline"
              size="sm"
              href={`/api/export?range=${rangeStr}`}
            >
              <Download /> {dict.actions.export}
            </LinkButton>
            <RangeTabs current={rangeStr} />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label={dict.overview.pageViews} value={kpis.pageViews.value} delta={kpis.pageViews.delta} />
        <StatCard label={dict.analytics.uniqueVisitors} value={kpis.uniqueVisitors.value} delta={kpis.uniqueVisitors.delta} />
        <StatCard label={dict.overview.productViews} value={kpis.productViews.value} delta={kpis.productViews.delta} />
        <StatCard label={dict.overview.productClicks} value={kpis.productClicks.value} delta={kpis.productClicks.delta} />
        <StatCard label={dict.analytics.clickThrough} value={`${kpis.ctr.value}%`} delta={kpis.ctr.delta} deltaSuffix="pts" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{dict.analytics.viewsVsClicksTime}</CardTitle>
          </CardHeader>
          <CardContent>
            <ViewsClicksChart data={series} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.devices}</CardTitle>
          </CardHeader>
          <CardContent>
            <DevicePie data={devices} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.topByViews}</CardTitle>
          </CardHeader>
          <CardContent>
            <RankBarChart
              data={byViews}
              dataKey="views"
              seriesName={dict.overview.productViews}
              color="var(--chart-1)"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.topByClicks}</CardTitle>
          </CardHeader>
          <CardContent>
            <RankBarChart
              data={byClicks}
              dataKey="clicks"
              seriesName={dict.overview.productClicks}
              color="var(--chart-2)"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{dict.analytics.needsAttention}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {dict.analytics.needsAttentionHelp}
          </p>
        </CardHeader>
        <CardContent>
          {noViews.length === 0 && noClicks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {dict.analytics.allProductsEngaged}
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="eyebrow">{dict.analytics.zeroViews}</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  {dict.analytics.zeroViewsHelp}
                </p>
                {noViews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">—</p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {noViews.slice(0, 8).map((p) => (
                      <li key={p.productId} className="py-1.5 text-sm">
                        <Link
                          href={`/products/${p.productId}/edit`}
                          className="font-medium hover:underline"
                        >
                          {p.name}
                        </Link>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {p.model}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="eyebrow">{dict.analytics.viewedNotClicked}</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  {dict.analytics.viewedNotClickedHelp}
                </p>
                {noClicks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">—</p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {noClicks.slice(0, 8).map((p) => (
                      <li
                        key={p.productId}
                        className="flex items-baseline justify-between gap-2 py-1.5 text-sm"
                      >
                        <Link
                          href={`/products/${p.productId}/edit`}
                          className="font-medium hover:underline"
                        >
                          {p.name}
                        </Link>
                        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                          {p.views} {dict.analytics.viewsLabel}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.topFinishes}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              items={finishes.map((f) => ({ label: f.finish, count: f.clicks }))}
              emptyLabel={dict.analytics.noFinish}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.topReferrers}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              items={referrers.map((r) => ({ label: r.source, count: r.count }))}
              emptyLabel={dict.analytics.noReferrers}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.topCountries}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              items={countries.map((c) => ({ label: c.country, count: c.count }))}
              emptyLabel={dict.analytics.noGeo}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={activity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
