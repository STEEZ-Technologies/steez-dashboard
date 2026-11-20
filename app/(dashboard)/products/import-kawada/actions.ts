"use server";

import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { importKawadaContent } from "@/lib/kawada-import";

export async function importKawadaSite() {
  const { tenantId, role } = await getTenantFromSession();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { slug: true } });
  if (tenant.slug !== "kawada" || role !== "OWNER") throw new Error("Kawada owner access required");
  const counts = await importKawadaContent(tenantId);
  await logAudit({ action: "kawada.site_import", entity: "tenant", entityId: tenantId, detail: JSON.stringify(counts) });
  for (const path of ["/", "/products", "/news", "/news/events", "/homepage", "/resources/documents"]) revalidatePath(path);
  return counts;
}
