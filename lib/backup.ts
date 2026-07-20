import "server-only";
import { gzipSync } from "zlib";
import { prisma } from "@/lib/db";
import { uploadBuffer } from "@/lib/oss";

// Analytics event volume grows unbounded — cap the backup to a recent
// window so the dump stays small and the cron function stays fast. Catalog
// and lead data (the stuff that actually needs restoring) is dumped in full.
const EVENT_WINDOW_DAYS = 90;

/**
 * Snapshots every tenant's data to a single gzip'd JSON object and uploads
 * it to OSS. Deliberately excludes User.passwordHash/totpSecret/recoveryCodes
 * — restoring accounts isn't the goal (the break-glass CLI handles that),
 * and there's no reason to put credential material in a backup file.
 */
export async function runBackup(): Promise<{ key: string; bytes: number }> {
  const since = new Date(Date.now() - EVENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [
    tenants,
    users,
    categories,
    products,
    productImages,
    productFinishes,
    leads,
    auditLogs,
    productEvents,
    pageViews,
  ] = await Promise.all([
    prisma.tenant.findMany(),
    prisma.user.findMany({
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.category.findMany(),
    prisma.product.findMany(),
    prisma.productImage.findMany(),
    prisma.productFinish.findMany(),
    prisma.lead.findMany(),
    prisma.auditLog.findMany(),
    prisma.productEvent.findMany({ where: { createdAt: { gte: since } } }),
    prisma.pageView.findMany({ where: { createdAt: { gte: since } } }),
  ]);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    eventWindowDays: EVENT_WINDOW_DAYS,
    tables: {
      tenants,
      users,
      categories,
      products,
      productImages,
      productFinishes,
      leads,
      auditLogs,
      productEvents,
      pageViews,
    },
  };

  const buffer = gzipSync(Buffer.from(JSON.stringify(snapshot)));
  const day = snapshot.generatedAt.slice(0, 10); // YYYY-MM-DD
  const key = `backups/${day}/steez-dashboard-${Date.now()}.json.gz`;

  await uploadBuffer(key, buffer, "application/gzip");

  return { key, bytes: buffer.length };
}
