import "server-only";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { hostOf } from "@/lib/analytics-helpers";
import { kawadaSource } from "@/lib/kawada-attribution";

export function enquirySource(referrer: string | null, kawada: boolean) {
  return kawada ? kawadaSource(referrer) : hostOf(referrer);
}

// Match the report's URL parser exactly, including legacy referrers and missing values.
export async function sourceCondition(where: Prisma.LeadWhereInput, source: string | null, kawada: boolean): Promise<Prisma.LeadWhereInput> {
  const referrers = await prisma.lead.groupBy({
    where,
    by: ["referrer"],
  });
  const matches = referrers.map(({ referrer }) => referrer).filter((referrer) => enquirySource(referrer, kawada) === source);
  return {
    OR: [
      { referrer: { in: matches.filter((value): value is string => value !== null) } },
      ...(matches.includes(null) ? [{ referrer: null }] : []),
    ],
  };
}

export async function linkedEnquirySessions(tenantId: string) {
  const rows = await prisma.$queryRaw<{ sessionId: string }[]>`
    SELECT DISTINCT l."sessionId" FROM "Lead" l
    WHERE l."tenantId" = ${tenantId} AND EXISTS (
      SELECT 1 FROM "PageView" p
      WHERE p."tenantId" = l."tenantId" AND p."sessionId" = l."sessionId"
    )
  `;
  return rows.map(({ sessionId }) => sessionId);
}
