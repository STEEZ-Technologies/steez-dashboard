import "server-only";
import { prisma } from "@/lib/db";
import { daysAgo } from "@/lib/analytics-helpers";

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
