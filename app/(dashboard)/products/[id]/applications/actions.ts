"use server";

import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { captureRevision, touchParent } from "@/lib/revisions";
import { i18nColumn } from "@/lib/product-i18n-server";
import type { LocalizedRowInput } from "@/components/products/localized-row-list";

async function assertOwnership(productId: string, tenantId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
    select: { id: true },
  });
  if (!product) throw new Error("Product not found");
}

export async function addProductApplication(
  productId: string,
  data: LocalizedRowInput,
) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(productId, tenantId);
  await captureRevision("product", productId, "child");
  if (!data.textEn.trim()) return;

  const max = await prisma.productApplication.aggregate({
    where: { productId },
    _max: { sortOrder: true },
  });
  await prisma.productApplication.create({
    data: {
      productId,
      textEn: data.textEn,
      textZh: data.textZh || null,
      ...i18nColumn(data.textI18n),
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  await logAudit({ action: "product.application_add", entity: "product", entityId: productId });
  await touchParent("product", productId, tenantId);
  revalidatePath(`/products/${productId}/edit`);
}

export async function updateProductApplication(
  productId: string,
  applicationId: string,
  data: LocalizedRowInput,
) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(productId, tenantId);
  await captureRevision("product", productId, "child");
  // updateMany so the row must belong to this (tenant-checked) product — a
  // applicationId from another tenant's product matches nothing.
  await prisma.productApplication.updateMany({
    where: { id: applicationId, productId },
    data: { textEn: data.textEn, textZh: data.textZh || null, ...i18nColumn(data.textI18n) },
  });
  await touchParent("product", productId, tenantId);
  revalidatePath(`/products/${productId}/edit`);
}

export async function removeProductApplication(productId: string, applicationId: string) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(productId, tenantId);
  await captureRevision("product", productId, "child");
  await prisma.productApplication.deleteMany({ where: { id: applicationId, productId } });
  await logAudit({ action: "product.application_remove", entity: "product", entityId: productId });
  await touchParent("product", productId, tenantId);
  revalidatePath(`/products/${productId}/edit`);
}

export async function moveProductApplication(
  productId: string,
  applicationId: string,
  direction: "up" | "down",
) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(productId, tenantId);
  await captureRevision("product", productId, "child");

  const rows = await prisma.productApplication.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  const idx = rows.findIndex((r) => r.id === applicationId);
  if (idx === -1) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= rows.length) return;

  await prisma.$transaction([
    prisma.productApplication.update({ where: { id: rows[idx].id }, data: { sortOrder: rows[swap].sortOrder } }),
    prisma.productApplication.update({ where: { id: rows[swap].id }, data: { sortOrder: rows[idx].sortOrder } }),
  ]);
  await touchParent("product", productId, tenantId);
  revalidatePath(`/products/${productId}/edit`);
}
