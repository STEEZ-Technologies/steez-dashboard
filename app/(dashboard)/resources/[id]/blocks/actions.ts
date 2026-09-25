"use server";

import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

async function assertOwnership(guideId: string, tenantId: string) {
  const guide = await prisma.guide.findFirst({
    where: { id: guideId, tenantId },
    select: { id: true },
  });
  if (!guide) throw new Error("Guide not found");
}

// Newline-separated list text -> a clean string[], dropping blank lines.
function splitItems(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function addGuideBlock(
  guideId: string,
  data: {
    kind: "P" | "H" | "LIST" | "TABLE";
    textEn?: string;
    textZh?: string;
    itemsEnText?: string;
    itemsZhText?: string;
  },
) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(guideId, tenantId);

  const max = await prisma.guideBlock.aggregate({
    where: { guideId },
    _max: { sortOrder: true },
  });

  await prisma.guideBlock.create({
    data: {
      guideId,
      kind: data.kind,
      textEn: data.kind === "P" || data.kind === "H" ? data.textEn || null : null,
      textZh: data.kind === "P" || data.kind === "H" ? data.textZh || null : null,
      itemsEn: data.kind === "LIST" && data.itemsEnText ? splitItems(data.itemsEnText) : undefined,
      itemsZh: data.kind === "LIST" && data.itemsZhText ? splitItems(data.itemsZhText) : undefined,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  await logAudit({ action: "guide.block_add", entity: "guide", entityId: guideId });
  revalidatePath(`/resources/${guideId}/edit`);
}

export async function updateGuideBlock(
  guideId: string,
  blockId: string,
  data: { textEn?: string; textZh?: string; itemsEnText?: string; itemsZhText?: string },
) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(guideId, tenantId);

  const block = await prisma.guideBlock.findFirst({ where: { id: blockId, guideId } });
  if (!block) return;

  await prisma.guideBlock.update({
    where: { id: blockId },
    data: {
      textEn: block.kind === "P" || block.kind === "H" ? data.textEn || null : block.textEn,
      textZh: block.kind === "P" || block.kind === "H" ? data.textZh || null : block.textZh,
      itemsEn: block.kind === "LIST" ? splitItems(data.itemsEnText ?? "") : block.itemsEn ?? undefined,
      itemsZh: block.kind === "LIST" ? splitItems(data.itemsZhText ?? "") : block.itemsZh ?? undefined,
    },
  });
  revalidatePath(`/resources/${guideId}/edit`);
}

export async function removeGuideBlock(guideId: string, blockId: string) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(guideId, tenantId);
  await prisma.guideBlock.deleteMany({ where: { id: blockId, guideId } });
  await logAudit({ action: "guide.block_remove", entity: "guide", entityId: guideId });
  revalidatePath(`/resources/${guideId}/edit`);
}

export async function moveGuideBlock(
  guideId: string,
  blockId: string,
  direction: "up" | "down",
) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(guideId, tenantId);

  const blocks = await prisma.guideBlock.findMany({
    where: { guideId },
    orderBy: { sortOrder: "asc" },
  });
  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx === -1) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= blocks.length) return;

  await prisma.$transaction([
    prisma.guideBlock.update({
      where: { id: blocks[idx].id },
      data: { sortOrder: blocks[swap].sortOrder },
    }),
    prisma.guideBlock.update({
      where: { id: blocks[swap].id },
      data: { sortOrder: blocks[idx].sortOrder },
    }),
  ]);
  revalidatePath(`/resources/${guideId}/edit`);
}
