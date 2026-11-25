import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { kawadaPages } from "@/lib/kawada-pages";
import { getTenantFromSession } from "@/lib/tenant";

export async function websitePage(page: string, language: string) {
  const definition = kawadaPages.find(([slug]) => slug === page);
  if (!definition || !["en", "zh", "es"].includes(language)) notFound();
  const actor = await getTenantFromSession();
  const { tenantId } = actor;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } });
  if (tenant?.slug !== "kawada") notFound();
  return { where: { tenantId, page, language }, definition, actor };
}
