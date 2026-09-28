"use server";

import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

async function assertOwnership(productId: string, tenantId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
    select: { id: true },
  });
  if (!product) throw new Error("Product not found");
}

export async function addProductContent(
  productId: string,
  data: { textEn: string; textZh?: string },
) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(productId, tenantId);
  if (!data.textEn.trim()) return;

  const max = await prisma.productContent.aggregate({
    where: { productId },
    _max: { sortOrder: true },
  });
  await prisma.productContent.create({
    data: {
      productId,
      textEn: data.textEn,
      textZh: data.textZh || null,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  await logAudit({ action: "product.content_add", entity: "product", entityId: productId });
  revalidatePath(`/products/${productId}/edit`);
}

export async function updateProductContent(
  productId: string,
  contentId: string,
  data: { textEn: string; textZh?: string },
) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(productId, tenantId);
  await prisma.productContent.update({
    where: { id: contentId },
    data: { textEn: data.textEn, textZh: data.textZh || null },
  });
  revalidatePath(`/products/${productId}/edit`);
}

export async function removeProductContent(productId: string, contentId: string) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(productId, tenantId);
  await prisma.productContent.deleteMany({ where: { id: contentId, productId } });
  await logAudit({ action: "product.content_remove", entity: "product", entityId: productId });
  revalidatePath(`/products/${productId}/edit`);
}

export async function moveProductContent(
  productId: string,
  contentId: string,
  direction: "up" | "down",
) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(productId, tenantId);

  const rows = await prisma.productContent.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  const idx = rows.findIndex((r) => r.id === contentId);
  if (idx === -1) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= rows.length) return;

  await prisma.$transaction([
    prisma.productContent.update({ where: { id: rows[idx].id }, data: { sortOrder: rows[swap].sortOrder } }),
    prisma.productContent.update({ where: { id: rows[swap].id }, data: { sortOrder: rows[idx].sortOrder } }),
  ]);
  revalidatePath(`/products/${productId}/edit`);
}
