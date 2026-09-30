import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { PLATFORM_TENANT_SLUG } from "@/lib/super-admin";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import {
  getKpis,
  getViewsVsClicksByDay,
  getPageViewsByDay,
  getRecentActivity,
  getWeeklyDigest,
  getTopProductsByViews,
  getTopProductsByClicks,
  getTopReferrers,
  getDeviceBreakdown,
  getTopCountries,
  getProductPerformance,
  zeroViewProducts,
  viewedNotClickedProducts,
} from "@/lib/analytics";
import { getPublishState } from "@/lib/publish";
import { PublishBanner } from "@/components/shell/publish-banner";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/overview/stat-card";
import { WeeklyDigest } from "@/components/overview/weekly-digest";
import { DealsCard } from "@/components/overview/deals-card";
import { getDealStats, getEnquiryMarkets } from "@/lib/leads-stats";
import { EnquiryMarkets } from "@/components/overview/enquiry-markets";
import { RangeTabs } from "@/components/analytics/range-tabs";
import { ViewsClicksChart } from "@/components/analytics/views-clicks-chart";
import { RankBarChart } from "@/components/analytics/rank-bar-chart";
import { BarList } from "@/components/analytics/bar-list";
import { DevicePie } from "@/components/analytics/device-pie";
import { ActivityFeed } from "@/components/analytics/activity-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { getDictionary, getLocale } from "@/lib/i18n";

const ALLOWED = new Set(["7", "30", "90"]);

// Overview and Analytics are one page: the headline numbers first, then the
// breakdowns that used to live on /analytics (which now redirects here).
export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { tenantId, role } = await getTenantFromSession();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  // STEEZ's workspace has no catalog or analytics of its own.
  if (tenant.slug === PLATFORM_TENANT_SLUG) redirect("/admin");
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const publishState = await getPublishState(tenantId);
  const sp = await searchParams;
  const rangeStr = sp.range && ALLOWED.has(sp.range) ? sp.range : "30";
  const days = Number(rangeStr);

  const [
    kpis,
    series,
    pv,
    activity,
    digest,
    byViews,
    byClicks,
    referrers,
    devices,
    countries,
    performance,
    deals,
    markets,
  ] = await Promise.all([
    getKpis(tenantId, days),
    getViewsVsClicksByDay(tenantId, days),
    getPageViewsByDay(tenantId, days),
    getRecentActivity(tenantId, 10),
    getWeeklyDigest(tenantId),
    getTopProductsByViews(tenantId, days),
    getTopProductsByClicks(tenantId, days),
    getTopReferrers(tenantId, days),
    getDeviceBreakdown(tenantId, days),
    getTopCountries(tenantId, days),
    getProductPerformance(tenantId, days),
    getDealStats(tenantId, days),
    getEnquiryMarkets(tenantId, days),
  ]);

  const pvSpark = pv.map((d) => d.count);
  const viewSpark = series.map((d) => d.views);
  const clickSpark = series.map((d) => d.clicks);
  const noViews = zeroViewProducts(performance);
  const noClicks = viewedNotClickedProducts(performance);

  return (
    <div>
      <PublishBanner
        pendingCount={publishState.pendingCount}
        configured={publishState.configured}
        canPublish={role === "OWNER"}
      />
      <PageHeader
        eyebrow={dict.pages.overview.eyebrow}
        title={dict.pages.overview.title}
        description={dict.overview.subtitle
          .replace("Konlito", tenant.name)
          .replace("30", String(days))}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <RangeTabs current={rangeStr} basePath="/" />
            <LinkButton
              variant="ghost"
              size="icon"
              href={`/api/export?range=${rangeStr}`}
              aria-label={dict.actions.export}
              title={dict.actions.export}
            >
              <Download />
            </LinkButton>
            <LinkButton href="/products/new">
              <Plus /> {dict.actions.newProduct}
            </LinkButton>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label={dict.overview.pageViews} value={kpis.pageViews.value} delta={kpis.pageViews.delta} spark={pvSpark} />
        <StatCard label={dict.analytics.uniqueVisitors} value={kpis.uniqueVisitors.value} delta={kpis.uniqueVisitors.delta} />
        <StatCard label={dict.overview.productViews} value={kpis.productViews.value} delta={kpis.productViews.delta} spark={viewSpark} />
        <StatCard label={dict.overview.productClicks} value={kpis.productClicks.value} delta={kpis.productClicks.delta} spark={clickSpark} />
        {/* Fifth card spans the row on phones instead of sitting alone. */}
        <div className="col-span-2 grid lg:col-span-1">
          <StatCard label={dict.overview.ctr} value={`${kpis.ctr.value}%`} delta={kpis.ctr.delta} deltaSuffix="pts" />
        </div>
      </div>

      <div className="mt-4">
        <DealsCard stats={deals} days={days} dict={dict} />
      </div>

      <div className="mt-4">
        <EnquiryMarkets
          countries={markets.countries}
          sources={markets.sources}
          dict={dict}
          locale={locale}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{dict.overview.viewsVsClicks}</CardTitle>
          </CardHeader>
          <CardContent>
            <ViewsClicksChart data={series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.overview.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={activity} />
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

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.devices}</CardTitle>
          </CardHeader>
          <CardContent>
            <DevicePie data={devices} />
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
        <WeeklyDigest digest={digest} />
      </div>
    </div>
  );
}
