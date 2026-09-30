"use server";

import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { captureRevision, touchParent } from "@/lib/revisions";

async function assertOwnership(articleId: string, tenantId: string) {
  const article = await prisma.article.findFirst({
    where: { id: articleId, tenantId },
    select: { id: true },
  });
  if (!article) throw new Error("Article not found");
}

// Newline-separated list text -> a clean string[], dropping blank lines.
function splitItems(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function addArticleBlock(
  articleId: string,
  data: {
    kind: "P" | "H" | "LIST";
    textEn?: string;
    textZh?: string;
    itemsEnText?: string;
    itemsZhText?: string;
  },
) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(articleId, tenantId);
  await captureRevision("article", articleId, "child");

  const max = await prisma.articleBlock.aggregate({
    where: { articleId },
    _max: { sortOrder: true },
  });

  await prisma.articleBlock.create({
    data: {
      articleId,
      kind: data.kind,
      textEn: data.kind === "P" || data.kind === "H" ? data.textEn || null : null,
      textZh: data.kind === "P" || data.kind === "H" ? data.textZh || null : null,
      itemsEn: data.kind === "LIST" && data.itemsEnText ? splitItems(data.itemsEnText) : undefined,
      itemsZh: data.kind === "LIST" && data.itemsZhText ? splitItems(data.itemsZhText) : undefined,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  await logAudit({ action: "article.block_add", entity: "article", entityId: articleId });
  await touchParent("article", articleId, tenantId);
  revalidatePath(`/news/${articleId}/edit`);
}

export async function updateArticleBlock(
  articleId: string,
  blockId: string,
  data: { textEn?: string; textZh?: string; itemsEnText?: string; itemsZhText?: string },
) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(articleId, tenantId);
  await captureRevision("article", articleId, "child");

  const block = await prisma.articleBlock.findFirst({ where: { id: blockId, articleId } });
  if (!block) return;

  await prisma.articleBlock.update({
    where: { id: blockId },
    data: {
      textEn: block.kind === "P" || block.kind === "H" ? data.textEn || null : block.textEn,
      textZh: block.kind === "P" || block.kind === "H" ? data.textZh || null : block.textZh,
      itemsEn: block.kind === "LIST" ? splitItems(data.itemsEnText ?? "") : block.itemsEn ?? undefined,
      itemsZh: block.kind === "LIST" ? splitItems(data.itemsZhText ?? "") : block.itemsZh ?? undefined,
    },
  });
  await touchParent("article", articleId, tenantId);
  revalidatePath(`/news/${articleId}/edit`);
}

export async function removeArticleBlock(articleId: string, blockId: string) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(articleId, tenantId);
  await captureRevision("article", articleId, "child");
  await prisma.articleBlock.deleteMany({ where: { id: blockId, articleId } });
  await logAudit({ action: "article.block_remove", entity: "article", entityId: articleId });
  await touchParent("article", articleId, tenantId);
  revalidatePath(`/news/${articleId}/edit`);
}

export async function moveArticleBlock(
  articleId: string,
  blockId: string,
  direction: "up" | "down",
) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(articleId, tenantId);
  await captureRevision("article", articleId, "child");

  const blocks = await prisma.articleBlock.findMany({
    where: { articleId },
    orderBy: { sortOrder: "asc" },
  });
  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx === -1) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= blocks.length) return;

  await prisma.$transaction([
    prisma.articleBlock.update({
      where: { id: blocks[idx].id },
      data: { sortOrder: blocks[swap].sortOrder },
    }),
    prisma.articleBlock.update({
      where: { id: blocks[swap].id },
      data: { sortOrder: blocks[idx].sortOrder },
    }),
  ]);
  await touchParent("article", articleId, tenantId);
  revalidatePath(`/news/${articleId}/edit`);
}
