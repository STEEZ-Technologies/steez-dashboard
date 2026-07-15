import "server-only";
import { prisma } from "@/lib/db";
import { getTenantFromSession } from "@/lib/tenant";

/**
 * Append an audit-log entry for a mutating action. Reads the acting user +
 * tenant from the session (cached per request). Never throws — audit failures
 * must not break the underlying mutation.
 */
export async function logAudit(entry: {
  action: string; // e.g. "product.create"
  entity: string; // e.g. "product"
  entityId?: string;
  detail?: string;
}) {
  try {
    const user = await getTenantFromSession();
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        detail: entry.detail,
      },
    });
  } catch {
    // swallow — audit is best-effort
  }
}

export async function getRecentAudit(tenantId: string, limit = 30) {
  return prisma.auditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
