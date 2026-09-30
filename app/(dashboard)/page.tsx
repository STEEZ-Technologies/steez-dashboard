import { ArrowRight, Plus } from "lucide-react";
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
} from "@/lib/analytics";
import { getPublishState } from "@/lib/publish";
import { PublishBanner } from "@/components/shell/publish-banner";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/overview/stat-card";
import { WeeklyDigest } from "@/components/overview/weekly-digest";
import { ViewsClicksChart } from "@/components/analytics/views-clicks-chart";
import { ActivityFeed } from "@/components/analytics/activity-feed";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { getDictionary } from "@/lib/i18n";

export default async function OverviewPage() {
  const { tenantId, role } = await getTenantFromSession();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  // STEEZ's workspace has no catalog or analytics of its own.
  if (tenant.slug === PLATFORM_TENANT_SLUG) redirect("/admin");
  const dict = await getDictionary();
  const publishState = await getPublishState(tenantId);

  const [kpis, series, pv, activity, digest] = await Promise.all([
    getKpis(tenantId, 30),
    getViewsVsClicksByDay(tenantId, 30),
    getPageViewsByDay(tenantId, 30),
    getRecentActivity(tenantId, 10),
    getWeeklyDigest(tenantId),
  ]);

  const pvSpark = pv.map((d) => d.count);
  const viewSpark = series.map((d) => d.views);
  const clickSpark = series.map((d) => d.clicks);

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
            {/* Analytics left the sidebar; this is its way in. */}
            <CardAction>
              <LinkButton variant="ghost" size="sm" href="/analytics">
                {dict.overview.fullAnalytics} <ArrowRight />
              </LinkButton>
            </CardAction>
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

      <div className="mt-4">
        <WeeklyDigest digest={digest} />
      </div>

    </div>
  );
}
