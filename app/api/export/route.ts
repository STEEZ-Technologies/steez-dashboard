import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// Auth'd, tenant-scoped CSV of tracked events for the selected range.
export async function GET(request: Request) {
  const { tenantId } = await getTenantFromSession();
  const url = new URL(request.url);
  const rangeStr = url.searchParams.get("range") ?? "30";
  const days = ["7", "30", "90"].includes(rangeStr) ? Number(rangeStr) : 30;
  const since = daysAgo(days);

  const [pageViews, productEvents] = await Promise.all([
    prisma.pageView.findMany({
      where: { tenantId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        path: true,
        referrer: true,
        country: true,
        userAgent: true,
        sessionId: true,
      },
    }),
    prisma.productEvent.findMany({
      where: { tenantId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { slug: true, name: true } } },
    }),
  ]);

  const header = [
    "timestamp",
    "type",
    "event",
    "path",
    "product",
    "finish",
    "referrer",
    "country",
    "sessionId",
  ];
  const lines = [header.join(",")];

  for (const pv of pageViews) {
    lines.push(
      [
        pv.createdAt.toISOString(),
        "page_view",
        "",
        pv.path,
        "",
        "",
        pv.referrer,
        pv.country,
        pv.sessionId,
      ]
        .map(csvCell)
        .join(","),
    );
  }

  for (const e of productEvents) {
    lines.push(
      [
        e.createdAt.toISOString(),
        "product_event",
        e.eventType,
        e.path,
        e.product?.name ?? "",
        e.finishKey,
        e.referrer,
        "",
        e.sessionId,
      ]
        .map(csvCell)
        .join(","),
    );
  }

  const csv = lines.join("\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="steez-analytics-${days}d-${stamp}.csv"`,
    },
  });
}
