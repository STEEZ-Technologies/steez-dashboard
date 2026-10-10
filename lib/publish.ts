import "server-only";
import { prisma } from "@/lib/db";

// The client's public site is a static export, so catalog edits are invisible
// until it rebuilds. We track "what changed since the last publish" by
// comparing row updatedAt against Tenant.lastPublishedAt, and let the owner
// trigger the rebuild through their host's deploy hook.

export type PublishState = {
  pendingCount: number;
  configured: boolean;
  lastPublishedAt: Date | null;
};

export async function getPublishState(tenantId: string): Promise<PublishState> {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { deployHookUrl: true, lastPublishedAt: true },
  });

  const since = tenant.lastPublishedAt;
  // Never published → everything counts as pending.
  const where = since ? { tenantId, updatedAt: { gt: since } } : { tenantId };

  const [products, categories, articles, guides, manualFacts, newsEvents, videos] = await Promise.all([
    prisma.product.count({ where }),
    prisma.category.count({ where }),
    prisma.article.count({ where }),
    prisma.guide.count({ where }),
    prisma.manualFact.count({ where }),
    prisma.newsEvent.count({ where }),
    prisma.video.count({ where }),
  ]);

  return {
    pendingCount: products + categories + articles + guides + manualFacts + newsEvents + videos,
    configured: Boolean(tenant.deployHookUrl),
    lastPublishedAt: tenant.lastPublishedAt,
  };
}

/**
 * The actual rows behind getPublishState's counts — powers the "preview
 * before publish" page so an owner can see exactly what a rebuild would
 * change, not just how many rows changed.
 */
export async function getPendingChanges(tenantId: string) {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { lastPublishedAt: true },
  });

  const since = tenant.lastPublishedAt;
  const where = since ? { tenantId, updatedAt: { gt: since } } : { tenantId };

  const [products, categories, articles, guides, manualFacts] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        category: true,
        finishes: { orderBy: { sortOrder: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
        models3d: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.category.findMany({ where, orderBy: { updatedAt: "desc" } }),
    prisma.article.findMany({ where, orderBy: { updatedAt: "desc" } }),
    prisma.guide.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { blocks: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.manualFact.findMany({ where, orderBy: { updatedAt: "desc" } }),
  ]);

  return { products, categories, articles, guides, manualFacts, lastPublishedAt: since };
}
