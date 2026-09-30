"use server";

import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { captureRevision, touchParent } from "@/lib/revisions";

async function assertOwnership(productId: string, tenantId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
    select: { id: true },
  });
  if (!product) throw new Error("Product not found");
}

export async function addProductModel3D(productId: string, modelPath: string) {
  if (!modelPath) return;
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(productId, tenantId);
  await captureRevision("product", productId, "child");

  const max = await prisma.productModel3D.aggregate({
    where: { productId },
    _max: { sortOrder: true },
  });
  await prisma.productModel3D.create({
    data: { productId, modelPath, sortOrder: (max._max.sortOrder ?? -1) + 1 },
  });
  await logAudit({ action: "product.model3d_add", entity: "product", entityId: productId });
  await touchParent("product", productId, tenantId);
  revalidatePath(`/products/${productId}/edit`);
}

export async function removeProductModel3D(productId: string, modelId: string) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(productId, tenantId);
  await captureRevision("product", productId, "child");
  await prisma.productModel3D.deleteMany({ where: { id: modelId, productId } });
  await logAudit({ action: "product.model3d_remove", entity: "product", entityId: productId });
  await touchParent("product", productId, tenantId);
  revalidatePath(`/products/${productId}/edit`);
}

export async function moveProductModel3D(
  productId: string,
  modelId: string,
  direction: "up" | "down",
) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(productId, tenantId);
  await captureRevision("product", productId, "child");

  const models = await prisma.productModel3D.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  const idx = models.findIndex((m) => m.id === modelId);
  if (idx === -1) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= models.length) return;

  await prisma.$transaction([
    prisma.productModel3D.update({ where: { id: models[idx].id }, data: { sortOrder: models[swap].sortOrder } }),
    prisma.productModel3D.update({ where: { id: models[swap].id }, data: { sortOrder: models[idx].sortOrder } }),
  ]);
  await touchParent("product", productId, tenantId);
  revalidatePath(`/products/${productId}/edit`);
}
