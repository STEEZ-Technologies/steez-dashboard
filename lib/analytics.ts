import "server-only";
import { prisma } from "@/lib/db";
import {
  daysAgo,
  pctDelta,
  ctrPercent,
  hostOf,
  deviceOf,
} from "@/lib/analytics-helpers";

/* ── KPIs with previous-period deltas ─────────────────────────── */

export type Kpi = { value: number; delta: number | null };
export type Kpis = {
  pageViews: Kpi;
  uniqueVisitors: Kpi;
  productViews: Kpi;
  productClicks: Kpi;
  ctr: Kpi; // click-through rate %, delta in points
};

export async function getKpis(tenantId: string, days = 30): Promise<Kpis> {
  const now = new Date();
  const start = daysAgo(days);
  const prevStart = daysAgo(days * 2);

  const [pv, pvPrev, sessions, sessionsPrev, events, eventsPrev] =
    await Promise.all([
      prisma.pageView.count({ where: { tenantId, createdAt: { gte: start } } }),
      prisma.pageView.count({
        where: { tenantId, createdAt: { gte: prevStart, lt: start } },
      }),
      prisma.pageView.findMany({
        where: { tenantId, createdAt: { gte: start } },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),
      prisma.pageView.findMany({
        where: { tenantId, createdAt: { gte: prevStart, lt: start } },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),
      prisma.productEvent.groupBy({
        by: ["eventType"],
        where: { tenantId, createdAt: { gte: start } },
        _count: { _all: true },
      }),
      prisma.productEvent.groupBy({
        by: ["eventType"],
        where: { tenantId, createdAt: { gte: prevStart, lt: start } },
        _count: { _all: true },
      }),
    ]);
  void now;

  const views = events.find((e) => e.eventType === "VIEW")?._count._all ?? 0;
  const clicks = events.find((e) => e.eventType === "CLICK")?._count._all ?? 0;
  const viewsPrev = eventsPrev.find((e) => e.eventType === "VIEW")?._count._all ?? 0;
  const clicksPrev = eventsPrev.find((e) => e.eventType === "CLICK")?._count._all ?? 0;

  // Clamp: with clean tracking clicks never exceed views, but dirty/test data
  // can, which would show a nonsensical >100% CTR.
  const ctr = ctrPercent(clicks, views);
  const ctrPrev = ctrPercent(clicksPrev, viewsPrev);

  return {
    pageViews: { value: pv, delta: pctDelta(pv, pvPrev) },
    uniqueVisitors: {
      value: sessions.length,
      delta: pctDelta(sessions.length, sessionsPrev.length),
    },
    productViews: { value: views, delta: pctDelta(views, viewsPrev) },
    productClicks: { value: clicks, delta: pctDelta(clicks, clicksPrev) },
    // CTR delta in points, but only when there's a comparable prior period.
    ctr: { value: ctr, delta: viewsPrev > 0 ? ctr - ctrPrev : null },
  };
}

/* ── Time series ──────────────────────────────────────────────── */

export async function getPageViewsByDay(tenantId: string, days = 30) {
  const since = daysAgo(days);
  const views = await prisma.pageView.findMany({
    where: { tenantId, createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const counts = new Map<string, number>();
  for (const v of views) {
    const day = v.createdAt.toISOString().slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getViewsVsClicksByDay(tenantId: string, days = 30) {
  const since = daysAgo(days);
  const events = await prisma.productEvent.findMany({
    where: { tenantId, createdAt: { gte: since } },
    select: { createdAt: true, eventType: true },
  });
  const map = new Map<string, { views: number; clicks: number }>();
  for (const e of events) {
    const day = e.createdAt.toISOString().slice(0, 10);
    const cur = map.get(day) ?? { views: 0, clicks: 0 };
    if (e.eventType === "VIEW") cur.views++;
    else cur.clicks++;
    map.set(day, cur);
  }
  return Array.from(map.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* ── Product leaderboards ─────────────────────────────────────── */

async function productNames(tenantId: string, ids: string[]) {
  const products = await prisma.product.findMany({
    where: { tenantId, id: { in: ids } },
    select: { id: true, name: true, slug: true },
  });
  return new Map(products.map((p) => [p.id, p]));
}

export async function getTopProductsByClicks(tenantId: string, days = 30, limit = 8) {
  const since = daysAgo(days);
  const grouped = await prisma.productEvent.groupBy({
    by: ["productId"],
    where: { tenantId, eventType: "CLICK", productId: { not: null }, createdAt: { gte: since } },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: limit,
  });
  const ids = grouped.map((g) => g.productId!).filter(Boolean);
  const names = await productNames(tenantId, ids);
  return grouped.map((g) => ({
    productId: g.productId as string,
    name: names.get(g.productId as string)?.name ?? "Unknown",
    clicks: g._count.productId,
  }));
}

export async function getTopProductsByViews(tenantId: string, days = 30, limit = 8) {
  const since = daysAgo(days);
  const grouped = await prisma.productEvent.groupBy({
    by: ["productId"],
    where: { tenantId, eventType: "VIEW", productId: { not: null }, createdAt: { gte: since } },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: limit,
  });
  const ids = grouped.map((g) => g.productId!).filter(Boolean);
  const names = await productNames(tenantId, ids);
  return grouped.map((g) => ({
    productId: g.productId as string,
    name: names.get(g.productId as string)?.name ?? "Unknown",
    views: g._count.productId,
  }));
}

/* ── Finishes (catalog-specific) ──────────────────────────────── */

export async function getTopFinishes(tenantId: string, days = 30, limit = 8) {
  const since = daysAgo(days);
  const grouped = await prisma.productEvent.groupBy({
    by: ["finishKey"],
    where: { tenantId, eventType: "CLICK", finishKey: { not: null }, createdAt: { gte: since } },
    _count: { finishKey: true },
    orderBy: { _count: { finishKey: "desc" } },
    take: limit,
  });
  return grouped.map((g) => ({
    finish: g.finishKey as string,
    clicks: g._count.finishKey,
  }));
}

/* ── Referrers ────────────────────────────────────────────────── */

export async function getTopReferrers(tenantId: string, days = 30, limit = 8) {
  const since = daysAgo(days);
  const rows = await prisma.pageView.findMany({
    where: { tenantId, createdAt: { gte: since } },
    select: { referrer: true },
  });
  const counts = new Map<string, number>();
  for (const r of rows) {
    const host = hostOf(r.referrer);
    counts.set(host, (counts.get(host) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/* ── Device breakdown ─────────────────────────────────────────── */

export async function getDeviceBreakdown(tenantId: string, days = 30) {
  const since = daysAgo(days);
  const rows = await prisma.pageView.findMany({
    where: { tenantId, createdAt: { gte: since } },
    select: { userAgent: true },
  });
  const counts = { Desktop: 0, Mobile: 0, Tablet: 0 };
  for (const r of rows) counts[deviceOf(r.userAgent)]++;
  return (Object.entries(counts) as [keyof typeof counts, number][])
    .map(([device, count]) => ({ device, count }))
    .filter((d) => d.count > 0);
}

/* ── Recent activity feed ─────────────────────────────────────── */

export type ActivityItem = {
  id: string;
  kind: "page_view" | "product_view" | "product_click";
  label: string;
  detail: string | null;
  at: Date;
};

export async function getRecentActivity(tenantId: string, limit = 12): Promise<ActivityItem[]> {
  const [events, views] = await Promise.all([
    prisma.productEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { product: { select: { name: true } } },
    }),
    prisma.pageView.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, path: true, createdAt: true },
    }),
  ]);

  const items: ActivityItem[] = [
    ...events.map((e) => ({
      id: e.id,
      kind: (e.eventType === "CLICK" ? "product_click" : "product_view") as ActivityItem["kind"],
      label: e.eventType === "CLICK" ? "Product clicked" : "Product viewed",
      detail: e.product?.name ?? e.finishKey ?? null,
      at: e.createdAt,
    })),
    ...views.map((v) => ({
      id: v.id,
      kind: "page_view" as const,
      label: "Page viewed",
      detail: v.path,
      at: v.createdAt,
    })),
  ];

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

/* ── Geo (offline geoip-lite, populated on the track endpoint) ─── */

export async function getTopCountries(tenantId: string, days = 30, limit = 8) {
  const since = daysAgo(days);
  const grouped = await prisma.pageView.groupBy({
    by: ["country"],
    where: { tenantId, country: { not: null }, createdAt: { gte: since } },
    _count: { country: true },
    orderBy: { _count: { country: "desc" } },
    take: limit,
  });
  return grouped.map((g) => ({
    country: g.country as string,
    count: g._count.country,
  }));
}

/* ── Per-product drill-down ───────────────────────────────────── */

export async function getProductAnalytics(
  tenantId: string,
  productId: string,
  days = 30,
) {
  const since = daysAgo(days);
  const prevStart = daysAgo(days * 2);
  const where = { tenantId, productId, createdAt: { gte: since } };

  const [events, eventsPrev, byDayRows, finishRows, referrerRows] =
    await Promise.all([
      prisma.productEvent.groupBy({
        by: ["eventType"],
        where,
        _count: { _all: true },
      }),
      prisma.productEvent.groupBy({
        by: ["eventType"],
        where: { tenantId, productId, createdAt: { gte: prevStart, lt: since } },
        _count: { _all: true },
      }),
      prisma.productEvent.findMany({
        where,
        select: { createdAt: true, eventType: true },
      }),
      prisma.productEvent.groupBy({
        by: ["finishKey"],
        where: { ...where, eventType: "CLICK", finishKey: { not: null } },
        _count: { finishKey: true },
        orderBy: { _count: { finishKey: "desc" } },
        take: 8,
      }),
      prisma.productEvent.findMany({
        where,
        select: { referrer: true },
      }),
    ]);

  const views = events.find((e) => e.eventType === "VIEW")?._count._all ?? 0;
  const clicks = events.find((e) => e.eventType === "CLICK")?._count._all ?? 0;
  const viewsPrev = eventsPrev.find((e) => e.eventType === "VIEW")?._count._all ?? 0;
  const clicksPrev = eventsPrev.find((e) => e.eventType === "CLICK")?._count._all ?? 0;

  // Views-vs-clicks time series.
  const dayMap = new Map<string, { views: number; clicks: number }>();
  for (const e of byDayRows) {
    const day = e.createdAt.toISOString().slice(0, 10);
    const cur = dayMap.get(day) ?? { views: 0, clicks: 0 };
    if (e.eventType === "VIEW") cur.views++;
    else cur.clicks++;
    dayMap.set(day, cur);
  }
  const byDay = Array.from(dayMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top referrers for this product.
  const refCounts = new Map<string, number>();
  for (const r of referrerRows) {
    const host = hostOf(r.referrer);
    refCounts.set(host, (refCounts.get(host) ?? 0) + 1);
  }
  const referrers = Array.from(refCounts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    views: { value: views, delta: pctDelta(views, viewsPrev) },
    clicks: { value: clicks, delta: pctDelta(clicks, clicksPrev) },
    ctr: { value: ctrPercent(clicks, views), delta: ctrPercent(clicks, views) - ctrPercent(clicksPrev, viewsPrev) },
    byDay,
    finishes: finishRows.map((f) => ({
      finish: f.finishKey as string,
      clicks: f._count.finishKey,
    })),
    referrers,
  };
}

/* Kept for backward compat with any existing imports */
export async function getUniqueVisitorCount(tenantId: string, days = 30): Promise<number> {
  const since = daysAgo(days);
  const rows = await prisma.pageView.findMany({
    where: { tenantId, createdAt: { gte: since } },
    distinct: ["sessionId"],
    select: { sessionId: true },
  });
  return rows.length;
}
