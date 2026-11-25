import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTenantFromSession } from "@/lib/tenant";

export default async function ResourcesLayout({ children }: { children: React.ReactNode }) {
  const { tenantId } = await getTenantFromSession();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { slug: true } });
  if (tenant.slug === "kawada") redirect("/website/home");
  return children;
}
