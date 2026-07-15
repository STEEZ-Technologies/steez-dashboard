import { Plus } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import {
  getKpis,
  getViewsVsClicksByDay,
  getPageViewsByDay,
  getRecentActivity,
} from "@/lib/analytics";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/overview/stat-card";
import { ViewsClicksChart } from "@/components/analytics/views-clicks-chart";
import { ActivityFeed } from "@/components/analytics/activity-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";

export default async function OverviewPage() {
  const { tenantId } = await getTenantFromSession();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  const [kpis, series, pv, activity, productCount] = await Promise.all([
    getKpis(tenantId, 30),
    getViewsVsClicksByDay(tenantId, 30),
    getPageViewsByDay(tenantId, 30),
    getRecentActivity(tenantId, 10),
    prisma.product.count({ where: { tenantId } }),
  ]);

  const pvSpark = pv.map((d) => d.count);
  const viewSpark = series.map((d) => d.views);
  const clickSpark = series.map((d) => d.clicks);

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title="Overview"
        description={`How buyers are engaging with ${tenant.name} — last 30 days.`}
        action={
          <LinkButton href="/products/new">
            <Plus /> New product
          </LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Page views" value={kpis.pageViews.value} delta={kpis.pageViews.delta} spark={pvSpark} />
        <StatCard label="Product views" value={kpis.productViews.value} delta={kpis.productViews.delta} spark={viewSpark} />
        <StatCard label="Product clicks" value={kpis.productClicks.value} delta={kpis.productClicks.delta} spark={clickSpark} />
        <StatCard label="Click-through rate" value={`${kpis.ctr.value}%`} delta={kpis.ctr.delta} deltaSuffix="pts" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Views vs clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <ViewsClicksChart data={series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={activity} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="eyebrow">Catalog</p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums">{productCount}</p>
            <p className="text-sm text-muted-foreground">products published & draft</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardContent className="flex flex-wrap items-center gap-3 p-5">
            <LinkButton variant="secondary" href="/products">
              Manage products
            </LinkButton>
            <LinkButton variant="secondary" href="/categories">
              Manage categories
            </LinkButton>
            <LinkButton variant="secondary" href="/analytics">
              Full analytics
            </LinkButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
