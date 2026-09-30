"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { articleInputSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { captureRevision } from "@/lib/revisions";

function splitKeywords(text: string | undefined) {
  return (text ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

function extractArticleExtras(formData: FormData) {
  const published = formData.get("published") === "on";
  return { published };
}

export async function createArticle(
  _prevState: string | undefined,
  formData: FormData,
) {
  const { tenantId } = await getTenantFromSession();
  const parsed = articleInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const { published } = extractArticleExtras(formData);
  const { keywordsEnText, keywordsZhText, ...rest } = parsed.data;

  const maxSort = await prisma.article.aggregate({
    where: { tenantId },
    _max: { sortOrder: true },
  });

  const created = await prisma.article.create({
    data: {
      ...rest,
      keywordsEn: splitKeywords(keywordsEnText),
      keywordsZh: splitKeywords(keywordsZhText),
      tenantId,
      published,
      publishedAt: published ? new Date() : null,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  await logAudit({
    action: "article.create",
    entity: "article",
    entityId: created.id,
    detail: created.titleEn,
  });
  revalidatePath("/news");
  redirect("/news?flash=" + encodeURIComponent("Article created"));
}

export async function updateArticle(
  id: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const { tenantId } = await getTenantFromSession();
  const parsed = articleInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const { published } = extractArticleExtras(formData);
  const { keywordsEnText, keywordsZhText, ...rest } = parsed.data;

  const existing = await prisma.article.findFirst({ where: { id, tenantId } });

  await captureRevision("article", id, "update");
  await prisma.article.updateMany({
    where: { id, tenantId },
    data: {
      ...rest,
      keywordsEn: splitKeywords(keywordsEnText),
      keywordsZh: splitKeywords(keywordsZhText),
      published,
      // Set publishedAt the first time an article goes live; never clear it
      // just because it's unpublished again — that's a history fact.
      publishedAt: published && !existing?.publishedAt ? new Date() : existing?.publishedAt,
    },
  });

  await logAudit({
    action: "article.update",
    entity: "article",
    entityId: id,
    detail: parsed.data.titleEn,
  });
  revalidatePath("/news");
  redirect("/news?flash=" + encodeURIComponent("Article updated"));
}

export async function deleteArticle(id: string) {
  const { tenantId } = await getTenantFromSession();
  await captureRevision("article", id, "delete");
  await prisma.article.deleteMany({ where: { id, tenantId } });
  await logAudit({ action: "article.delete", entity: "article", entityId: id });
  revalidatePath("/news");
}

export async function moveArticle(id: string, direction: "up" | "down") {
  const { tenantId } = await getTenantFromSession();

  const articles = await prisma.article.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });
  const index = articles.findIndex((a) => a.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= articles.length) return;

  const current = articles[index];
  const swap = articles[swapIndex];

  await prisma.$transaction([
    prisma.article.update({ where: { id: current.id }, data: { sortOrder: swap.sortOrder } }),
    prisma.article.update({ where: { id: swap.id }, data: { sortOrder: current.sortOrder } }),
  ]);

  revalidatePath("/news");
}

export async function reorderArticles(orderedIds: string[]) {
  const { tenantId } = await getTenantFromSession();
  const owned = await prisma.article.findMany({
    where: { tenantId, id: { in: orderedIds } },
    select: { id: true },
  });
  const ownedSet = new Set(owned.map((a) => a.id));
  const ids = orderedIds.filter((id) => ownedSet.has(id));

  await prisma.$transaction(
    ids.map((id, i) => prisma.article.update({ where: { id }, data: { sortOrder: i } })),
  );
  await logAudit({ action: "article.reorder", entity: "article" });
  revalidatePath("/news");
}
