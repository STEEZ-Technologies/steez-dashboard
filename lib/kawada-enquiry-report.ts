import "server-only";
import { prisma } from "@/lib/db";
import { enquirySource, linkedEnquirySessions } from "@/lib/enquiry-attribution-query";
import { enquiryWhere, type EnquiryPeriod } from "@/lib/enquiry-query";
import type { EnquiryFilters } from "@/lib/kawada-enquiry-options";

type FunnelCounts = {
  visits: number;
  product: number;
  started: number;
  submitted: number;
  submittedWithProduct: number;
  submittedFromContact: number;
};

export async function getKawadaFunnel(tenantId: string, { start, end }: EnquiryPeriod) {
  const [counts] = await prisma.$queryRaw<FunnelCounts[]>`
    WITH entry AS (
      SELECT DISTINCT ON (p."sessionId") p."sessionId", p."path"
      FROM "PageView" p
      WHERE p."tenantId" = ${tenantId} AND p."createdAt" >= ${start} AND p."createdAt" < ${end}
        AND NOT EXISTS (
          SELECT 1 FROM "PageView" earlier
          WHERE earlier."tenantId" = p."tenantId" AND earlier."sessionId" = p."sessionId"
            AND earlier."createdAt" < ${start}
        )
      ORDER BY p."sessionId", p."createdAt", p."id"
    ), milestones AS (
      SELECT entry."path",
        EXISTS (
          SELECT 1 FROM "ProductEvent" p
          WHERE p."tenantId" = ${tenantId} AND p."sessionId" = entry."sessionId"
            AND p."eventType" = 'VIEW' AND p."createdAt" >= ${start} AND p."createdAt" < ${end}
        ) AS product,
        EXISTS (
          SELECT 1 FROM "EnquiryStart" s
          WHERE s."tenantId" = ${tenantId} AND s."sessionId" = entry."sessionId"
            AND s."createdAt" >= ${start} AND s."createdAt" < ${end}
        ) AS started,
        EXISTS (
          SELECT 1 FROM "Lead" l
          WHERE l."tenantId" = ${tenantId} AND l."sessionId" = entry."sessionId"
            AND l."createdAt" >= ${start} AND l."createdAt" < ${end}
        ) AS submitted
      FROM entry
    )
    SELECT COUNT(*)::int AS visits,
      COUNT(*) FILTER (WHERE product)::int AS product,
      COUNT(*) FILTER (WHERE started)::int AS started,
      COUNT(*) FILTER (WHERE submitted)::int AS submitted,
      COUNT(*) FILTER (WHERE submitted AND product)::int AS "submittedWithProduct",
      COUNT(*) FILTER (
        WHERE submitted AND NOT product AND "path" ~ '^(/(en|zh|es))?/contact-us/?$'
      )::int AS "submittedFromContact"
    FROM milestones
  `;
  return counts;
}

function breakdown(keys: (string | null)[]) {
  const totals = new Map<string | null, number>();
  for (const key of keys) totals.set(key, (totals.get(key) ?? 0) + 1);
  return Array.from(totals, ([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || (a.key ?? "").localeCompare(b.key ?? ""));
}

export async function getKawadaEnquiryReport(
  tenantId: string,
  { start, end }: EnquiryPeriod,
  filters: EnquiryFilters,
) {
  const [rows, linked] = await Promise.all([
    prisma.lead.findMany({
      where: enquiryWhere(tenantId, { report: "kawada", period: { start, end }, filters }),
      select: {
        buyerCountry: true, productInterest: true, orderVolume: true, formLanguage: true,
        referrer: true, sessionId: true,
      },
    }),
    linkedEnquirySessions(tenantId),
  ]);
  const linkedSessions = new Set(linked);
  return {
    total: rows.length,
    unattributed: rows.filter((row) => row.sessionId === null || !linkedSessions.has(row.sessionId)).length,
    sources: breakdown(rows.map((row) => enquirySource(row.referrer, true))),
    buyerCountry: breakdown(rows.map((row) => row.buyerCountry)),
    productInterest: breakdown(rows.map((row) => row.productInterest)),
    orderVolume: breakdown(rows.map((row) => row.orderVolume)),
    formLanguage: breakdown(rows.map((row) => row.formLanguage)),
  };
}
