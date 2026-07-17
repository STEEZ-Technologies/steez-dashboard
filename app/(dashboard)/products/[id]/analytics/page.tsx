import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getProductAnalytics } from "@/lib/analytics";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/overview/stat-card";
import { LinkButton } from "@/components/ui/link-button";
import { RangeTabs } from "@/components/analytics/range-tabs";
import { ViewsClicksChart } from "@/components/analytics/views-clicks-chart";
import { BarList } from "@/components/analytics/bar-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";

const ALLOWED = new Set(["7", "30", "90"]);

export default async function ProductAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { id } = await params;
  const { tenantId } = await getTenantFromSession();
  const product = await prisma.product.findFirst({
    where: { id, tenantId },
    select: { id: true, name: true, model: true },
  });
  if (!product) notFound();

  const sp = await searchParams;
  const rangeStr = sp.range && ALLOWED.has(sp.range) ? sp.range : "30";
  const days = Number(rangeStr);
  const data = await getProductAnalytics(tenantId, product.id, days);
  const dict = await getDictionary();

  return (
    <div>
      <div className="mb-4">
        <LinkButton variant="ghost" size="sm" href={`/products/${product.id}/edit`}>
          <ArrowLeft /> {dict.actions.back}
        </LinkButton>
      </div>
      <PageHeader
        eyebrow={product.model}
        title={product.name}
        description={dict.analytics.lastDays.replace("{days}", String(days))}
        action={<RangeTabs current={rangeStr} basePath={`/products/${product.id}/analytics`} />}
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label={dict.overview.productViews} value={data.views.value} delta={data.views.delta} />
        <StatCard label={dict.overview.productClicks} value={data.clicks.value} delta={data.clicks.delta} />
        <StatCard
          label={dict.analytics.clickThrough}
          value={`${data.ctr.value}%`}
          delta={data.ctr.delta}
          deltaSuffix="pts"
        />
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.viewsVsClicksTime}</CardTitle>
          </CardHeader>
          <CardContent>
            <ViewsClicksChart data={data.byDay} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.topFinishes}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              items={data.finishes.map((f) => ({ label: f.finish, count: f.clicks }))}
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
              items={data.referrers.map((r) => ({ label: r.source, count: r.count }))}
              emptyLabel={dict.analytics.noReferrers}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
