import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/app/generated/prisma/client";
import { getTenantFromSession } from "@/lib/tenant";
import {
  DELETED_WINDOW_DAYS,
  FIELDS,
  isRevisionEntity,
  KEEP_PER_ITEM,
  liveVersion,
  shouldCoalesce,
  toSnapshot,
  type RevisionAction,
  type RevisionEntity,
  type Snapshot,
} from "@/lib/revisions-core";

// Database half of the version history — see lib/revisions-core.ts for the
// rules. Every mutating catalogue action calls captureRevision() *before* it
// writes, so each Revision row is the state an item was in just before a
// change, and restoring one puts the item back exactly.

type Db = Prisma.TransactionClient | typeof prisma;

async function loadRow(db: Db, tenantId: string, entity: RevisionEntity, id: string) {
  const where = { id, tenantId };
  const asc = { orderBy: { sortOrder: "asc" as const } };
  switch (entity) {
    case "product":
      return db.product.findFirst({
        where,
        include: { fit: true, images: asc, contents: asc, finishes: asc, models3d: asc },
      });
    case "article":
      return db.article.findFirst({ where, include: { blocks: asc } });
    case "guide":
      return db.guide.findFirst({ where, include: { blocks: asc } });
    case "category":
      return db.category.findFirst({ where, include: { products: { select: { id: true } } } });
  }
}

function labelOf(entity: RevisionEntity, row: Record<string, unknown>) {
  const v = entity === "product" ? row.name : entity === "category" ? row.label : row.titleEn;
  return typeof v === "string" && v ? v : "(untitled)";
}

/** The item's current state as a snapshot, or null if it no longer exists. */
export async function currentSnapshot(tenantId: string, entity: RevisionEntity, id: string) {
  const row = await loadRow(prisma, tenantId, entity, id);
  return row ? toSnapshot(entity, row as unknown as Record<string, unknown>) : null;
}

async function prune(tenantId: string, entity: RevisionEntity, entityId: string) {
  const stale = await prisma.revision.findMany({
    where: { tenantId, entity, entityId },
    orderBy: { createdAt: "desc" },
    skip: KEEP_PER_ITEM,
    select: { id: true },
  });
  if (stale.length) {
    await prisma.revision.deleteMany({ where: { id: { in: stale.map((r) => r.id) } } });
  }
}

/**
 * Save the item's current state as a version before it changes. Never throws
 * — like logAudit, a failed snapshot must not block the edit itself.
 */
export async function captureRevision(
  entity: RevisionEntity,
  id: string,
  action: RevisionAction,
) {
  try {
    const user = await getTenantFromSession();
    const row = await loadRow(prisma, user.tenantId, entity, id);
    if (!row) return;

    if (action === "child") {
      const last = await prisma.revision.findFirst({
        where: { tenantId: user.tenantId, entity, entityId: id },
        orderBy: { createdAt: "desc" },
        select: { userId: true, action: true, createdAt: true },
      });
      if (shouldCoalesce(last, { userId: user.id, action }, new Date())) return;
    }

    const record = row as unknown as Record<string, unknown>;
    await prisma.revision.create({
      data: {
        tenantId: user.tenantId,
        entity,
        entityId: id,
        label: labelOf(entity, record),
        action,
        snapshot: toSnapshot(entity, record) as Prisma.InputJsonValue,
        userId: user.id,
        userEmail: user.email ?? null,
      },
    });
    await prune(user.tenantId, entity, id);
  } catch (err) {
    console.error("[revisions] capture failed", entity, id, err);
  }
}

export async function captureRevisions(
  entity: RevisionEntity,
  ids: string[],
  action: RevisionAction,
) {
  for (const id of ids) await captureRevision(entity, id, action);
}

// Child actions change a block or a gallery image, not the parent row, so
// the parent's updatedAt never moved and the edit never counted as "not yet
// live". Touching it here is what makes the publish banner — and Discard —
// see those edits.
export async function touchParent(entity: RevisionEntity, id: string, tenantId: string) {
  const where = { id, tenantId };
  const data = { updatedAt: new Date() };
  if (entity === "product") await prisma.product.updateMany({ where, data });
  if (entity === "article") await prisma.article.updateMany({ where, data });
  if (entity === "guide") await prisma.guide.updateMany({ where, data });
}

// ---- restore -------------------------------------------------------------

const JSON_FIELDS = new Set(["specs", "itemsEn", "itemsZh"]);
const DATE_FIELDS = new Set(["publishedAt"]);

// Json columns can't take a bare null through Prisma, and dates come back
// from the snapshot as ISO strings.
function toColumn(key: string, v: unknown) {
  if (JSON_FIELDS.has(key)) return v === null || v === undefined ? Prisma.DbNull : v;
  if (DATE_FIELDS.has(key)) return typeof v === "string" ? new Date(v) : null;
  return v;
}

function columns(snap: Snapshot, keys: readonly string[]) {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in snap) out[k] = toColumn(k, snap[k]);
  return out;
}

function childRows(snap: Snapshot, key: string, parent: Record<string, string>) {
  return ((snap[key] as Snapshot[] | undefined) ?? []).map((c) => ({
    ...columns(c, Object.keys(c)),
    ...parent,
  }));
}

export type RestoreResult =
  | { ok: true; entity: RevisionEntity; entityId: string; label: string }
  | { ok: false; error: string };

async function slugTaken(tx: Db, tenantId: string, entity: RevisionEntity, id: string, slug: unknown) {
  if (typeof slug !== "string") return false;
  const where = { tenantId, slug, NOT: { id } };
  const clash =
    entity === "product" ? await tx.product.findFirst({ where, select: { id: true } })
    : entity === "article" ? await tx.article.findFirst({ where, select: { id: true } })
    : entity === "guide" ? await tx.guide.findFirst({ where, select: { id: true } })
    : await tx.category.findFirst({ where, select: { id: true } });
  return Boolean(clash);
}

async function writeSnapshot(
  tx: Prisma.TransactionClient,
  tenantId: string,
  entity: RevisionEntity,
  id: string,
  snap: Snapshot,
  exists: boolean,
) {
  const data = columns(snap, FIELDS[entity]);
  // Recreating a deleted item puts it back where it sat in its list.
  const create: Record<string, unknown> = { ...data, id, tenantId, sortOrder: Number(snap.sortOrder ?? 0) };

  switch (entity) {
    case "product": {
      if (typeof data.categoryId === "string") {
        const cat = await tx.category.findFirst({ where: { id: data.categoryId, tenantId } });
        if (!cat) data.categoryId = null; // its category was deleted since
        create.categoryId = data.categoryId;
      }
      if (exists) await tx.product.update({ where: { id }, data: data as Prisma.ProductUncheckedUpdateInput });
      else await tx.product.create({ data: create as Prisma.ProductUncheckedCreateInput });

      const productId = { productId: id };
      await tx.productFit.deleteMany({ where: productId });
      if (snap.fit) {
        await tx.productFit.create({
          data: { ...columns(snap.fit as Snapshot, Object.keys(snap.fit as Snapshot)), ...productId } as Prisma.ProductFitUncheckedCreateInput,
        });
      }
      await tx.productImage.deleteMany({ where: productId });
      await tx.productImage.createMany({ data: childRows(snap, "images", productId) as Prisma.ProductImageCreateManyInput[] });
      await tx.productContent.deleteMany({ where: productId });
      await tx.productContent.createMany({ data: childRows(snap, "contents", productId) as Prisma.ProductContentCreateManyInput[] });
      await tx.productFinish.deleteMany({ where: productId });
      await tx.productFinish.createMany({ data: childRows(snap, "finishes", productId) as Prisma.ProductFinishCreateManyInput[] });
      await tx.productModel3D.deleteMany({ where: productId });
      await tx.productModel3D.createMany({ data: childRows(snap, "models3d", productId) as Prisma.ProductModel3DCreateManyInput[] });
      return;
    }
    case "article": {
      if (exists) await tx.article.update({ where: { id }, data: data as Prisma.ArticleUncheckedUpdateInput });
      else await tx.article.create({ data: create as Prisma.ArticleUncheckedCreateInput });
      await tx.articleBlock.deleteMany({ where: { articleId: id } });
      await tx.articleBlock.createMany({ data: childRows(snap, "blocks", { articleId: id }) as Prisma.ArticleBlockCreateManyInput[] });
      return;
    }
    case "guide": {
      if (exists) await tx.guide.update({ where: { id }, data: data as Prisma.GuideUncheckedUpdateInput });
      else await tx.guide.create({ data: create as Prisma.GuideUncheckedCreateInput });
      await tx.guideBlock.deleteMany({ where: { guideId: id } });
      await tx.guideBlock.createMany({ data: childRows(snap, "blocks", { guideId: id }) as Prisma.GuideBlockCreateManyInput[] });
      return;
    }
    case "category": {
      if (exists) {
        await tx.category.update({ where: { id }, data: data as Prisma.CategoryUncheckedUpdateInput });
      } else {
        await tx.category.create({ data: create as Prisma.CategoryUncheckedCreateInput });
        // Deleting the category unlinked its products; link back the ones
        // that still exist and haven't been given another category since.
        const ids = (snap.productIds as string[] | undefined) ?? [];
        if (ids.length) {
          await tx.product.updateMany({
            where: { tenantId, id: { in: ids }, categoryId: null },
            data: { categoryId: id },
          });
        }
      }
      return;
    }
  }
}

/** Put an item back to a saved version. Saves the current state first. */
export async function restoreRevision(revisionId: string): Promise<RestoreResult> {
  const user = await getTenantFromSession();
  const rev = await prisma.revision.findFirst({ where: { id: revisionId, tenantId: user.tenantId } });
  if (!rev || !isRevisionEntity(rev.entity)) return { ok: false, error: "That version no longer exists." };

  const entity = rev.entity;
  const snap = rev.snapshot as Snapshot;
  const exists = Boolean(await loadRow(prisma, user.tenantId, entity, rev.entityId));

  if (await slugTaken(prisma, user.tenantId, entity, rev.entityId, snap.slug)) {
    return {
      ok: false,
      error: `Another item already uses the address “${String(snap.slug)}”. Change that one first.`,
    };
  }

  // The state being replaced becomes a version too, so a restore can be undone.
  if (exists) await captureRevision(entity, rev.entityId, "restore");

  try {
    await prisma.$transaction((tx) =>
      writeSnapshot(tx, user.tenantId, entity, rev.entityId, snap, exists),
    );
  } catch (err) {
    console.error("[revisions] restore failed", revisionId, err);
    return { ok: false, error: "Couldn't restore that version. Nothing was changed." };
  }
  return { ok: true, entity, entityId: rev.entityId, label: rev.label };
}

// ---- reads for the UI ----------------------------------------------------

export async function getHistory(tenantId: string, entity: RevisionEntity, entityId: string) {
  return prisma.revision.findMany({
    where: { tenantId, entity, entityId },
    orderBy: { createdAt: "desc" },
    take: KEEP_PER_ITEM,
  });
}

async function itemTimes(tenantId: string, entity: RevisionEntity, id: string) {
  const where = { id, tenantId };
  const select = { createdAt: true, updatedAt: true } as const;
  if (entity === "product") return prisma.product.findFirst({ where, select });
  if (entity === "article") return prisma.article.findFirst({ where, select });
  if (entity === "guide") return prisma.guide.findFirst({ where, select });
  return prisma.category.findFirst({ where, select });
}

/** Which version of an item the live site shows — see liveVersion(). */
export async function getLiveVersion(tenantId: string, entity: RevisionEntity, entityId: string) {
  const [tenant, item, revisions] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { lastPublishedAt: true } }),
    itemTimes(tenantId, entity, entityId),
    prisma.revision.findMany({
      where: { tenantId, entity, entityId },
      select: { id: true, createdAt: true },
    }),
  ]);
  if (!item) return { kind: "none" } as const;
  return liveVersion(revisions, item, tenant.lastPublishedAt);
}

/**
 * Items deleted in the last DELETED_WINDOW_DAYS that are still gone, newest
 * first — one row per item, its last snapshot before deletion.
 */
export async function getRecentlyDeleted(tenantId: string) {
  const since = new Date(Date.now() - DELETED_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const deletes = await prisma.revision.findMany({
    where: { tenantId, action: "delete", createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    select: { id: true, entity: true, entityId: true, label: true, userEmail: true, createdAt: true },
  });

  const byEntity = new Map<string, string[]>();
  for (const d of deletes) byEntity.set(d.entity, [...(byEntity.get(d.entity) ?? []), d.entityId]);
  const alive = new Set<string>();
  for (const [entity, ids] of byEntity) {
    const where = { tenantId, id: { in: ids } };
    const select = { id: true } as const;
    const rows =
      entity === "product" ? await prisma.product.findMany({ where, select })
      : entity === "article" ? await prisma.article.findMany({ where, select })
      : entity === "guide" ? await prisma.guide.findMany({ where, select })
      : entity === "category" ? await prisma.category.findMany({ where, select })
      : [];
    for (const r of rows) alive.add(`${entity}:${r.id}`);
  }

  const seen = new Set<string>();
  return deletes.filter((d) => {
    const key = `${d.entity}:${d.entityId}`;
    if (alive.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
