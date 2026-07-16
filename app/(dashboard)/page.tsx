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
import { getDictionary } from "@/lib/i18n";

export default async function OverviewPage() {
  const { tenantId } = await getTenantFromSession();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  const dict = await getDictionary();

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
        eyebrow={dict.pages.overview.eyebrow}
        title={dict.pages.overview.title}
        description={`${dict.overview.subtitle.replace("Konlito", tenant.name)}`}
        action={
          <LinkButton href="/products/new">
            <Plus /> {dict.actions.newProduct}
          </LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={dict.overview.pageViews} value={kpis.pageViews.value} delta={kpis.pageViews.delta} spark={pvSpark} />
        <StatCard label={dict.overview.productViews} value={kpis.productViews.value} delta={kpis.productViews.delta} spark={viewSpark} />
        <StatCard label={dict.overview.productClicks} value={kpis.productClicks.value} delta={kpis.productClicks.delta} spark={clickSpark} />
        <StatCard label={dict.overview.ctr} value={`${kpis.ctr.value}%`} delta={kpis.ctr.delta} deltaSuffix="pts" />
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

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="eyebrow">{dict.overview.catalog}</p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums">{productCount}</p>
            <p className="text-sm text-muted-foreground">{dict.overview.productsPublishedDraft}</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardContent className="flex flex-wrap items-center gap-3 p-5">
            <LinkButton variant="secondary" href="/products">
              {dict.overview.manageProducts}
            </LinkButton>
            <LinkButton variant="secondary" href="/categories">
              {dict.overview.manageCategories}
            </LinkButton>
            <LinkButton variant="secondary" href="/analytics">
              {dict.overview.fullAnalytics}
            </LinkButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
