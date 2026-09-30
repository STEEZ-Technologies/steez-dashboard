import "server-only";
import { prisma } from "@/lib/db";
import { daysAgo, hostOf } from "@/lib/analytics-helpers";

export type DealStats = {
  enquiries: number;
  won: number;
  /** Won ÷ closed (won + lost), as an integer %. null until anything closes. */
  winRate: number | null;
  /** Won value summed per currency — never converted across currencies. */
  wonValue: { currency: string; total: number }[];
};

/** Enquiries received in the window, and deals closed in it. Archived
 *  enquiries (spam) count toward neither. */
export async function getDealStats(tenantId: string, days = 30): Promise<DealStats> {
  const since = daysAgo(days);
  const [enquiries, closed, valueRows] = await Promise.all([
    prisma.lead.count({
      where: { tenantId, createdAt: { gte: since }, status: { not: "ARCHIVED" } },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: { tenantId, status: { in: ["WON", "LOST"] }, closedAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["dealCurrency"],
      where: {
        tenantId,
        status: "WON",
        closedAt: { gte: since },
        dealCurrency: { not: null },
        dealValue: { not: null },
      },
      _sum: { dealValue: true },
    }),
  ]);

  const won = closed.find((c) => c.status === "WON")?._count._all ?? 0;
  const lost = closed.find((c) => c.status === "LOST")?._count._all ?? 0;

  return {
    enquiries,
    won,
    winRate: won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null,
    wonValue: valueRows
      .map((r) => ({ currency: r.dealCurrency as string, total: Number(r._sum.dealValue ?? 0) }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total),
  };
}

export type MarketRow = {
  key: string; // country code or source host
  enquiries: number;
  won: number;
  /** Enquiries ÷ unique visitors from that country, as a % (countries only). */
  rate: number | null;
};

/** Which countries and traffic sources produce enquiries — not just visits.
 *  Archived (spam) enquiries are left out. */
export async function getEnquiryMarkets(
  tenantId: string,
  days = 30,
  limit = 6,
): Promise<{ countries: MarketRow[]; sources: MarketRow[] }> {
  const since = daysAgo(days);
  const leads = await prisma.lead.findMany({
    where: { tenantId, createdAt: { gte: since }, status: { not: "ARCHIVED" } },
    select: { country: true, referrer: true, status: true },
  });

  const tally = (keyOf: (l: (typeof leads)[number]) => string | null) => {
    const m = new Map<string, { enquiries: number; won: number }>();
    for (const l of leads) {
      const k = keyOf(l);
      if (!k) continue;
      const row = m.get(k) ?? { enquiries: 0, won: 0 };
      row.enquiries += 1;
      if (l.status === "WON") row.won += 1;
      m.set(k, row);
    }
    return [...m.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.enquiries - a.enquiries || b.won - a.won)
      .slice(0, limit);
  };

  const byCountry = tally((l) => l.country);
  const bySource = tally((l) => hostOf(l.referrer));

  // Visitors per enquiring country, for the enquiry rate.
  const codes = byCountry.map((c) => c.key);
  const visitors =
    codes.length === 0
      ? []
      : await prisma.$queryRaw<{ country: string; n: bigint }[]>`
          SELECT "country", COUNT(DISTINCT "sessionId") AS n
          FROM "PageView"
          WHERE "tenantId" = ${tenantId}
            AND "createdAt" >= ${since}
            AND "country" = ANY(${codes})
          GROUP BY "country"`;
  const visitorsOf = new Map(visitors.map((v) => [v.country, Number(v.n)]));

  return {
    countries: byCountry.map((c) => {
      const v = visitorsOf.get(c.key) ?? 0;
      return { ...c, rate: v > 0 ? Math.min(100, Math.round((c.enquiries / v) * 1000) / 10) : null };
    }),
    sources: bySource.map((s) => ({ ...s, rate: null })),
  };
}
