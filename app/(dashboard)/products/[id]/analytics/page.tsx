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

  return (
    <div>
      <div className="mb-4">
        <LinkButton variant="ghost" size="sm" href={`/products/${product.id}/edit`}>
          <ArrowLeft /> Back to product
        </LinkButton>
      </div>
      <PageHeader
        eyebrow={product.model}
        title={product.name}
        description={`Performance over the last ${days} days.`}
        action={<RangeTabs current={rangeStr} basePath={`/products/${product.id}/analytics`} />}
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Views" value={data.views.value} delta={data.views.delta} />
        <StatCard label="Clicks" value={data.clicks.value} delta={data.clicks.delta} />
        <StatCard
          label="Click-through"
          value={`${data.ctr.value}%`}
          delta={data.ctr.delta}
          deltaSuffix="pts"
        />
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Views vs clicks over time</CardTitle>
          </CardHeader>
          <CardContent>
            <ViewsClicksChart data={data.byDay} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top finishes clicked</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              items={data.finishes.map((f) => ({ label: f.finish, count: f.clicks }))}
              emptyLabel="No finish clicks yet."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              items={data.referrers.map((r) => ({ label: r.source, count: r.count }))}
              emptyLabel="No referrers yet."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
