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

export async function addProductImage(productId: string, imagePath: string) {
  if (!imagePath) return;
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(productId, tenantId);
  await captureRevision("product", productId, "child");

  const max = await prisma.productImage.aggregate({
    where: { productId },
    _max: { sortOrder: true },
  });
  await prisma.productImage.create({
    data: { productId, imagePath, sortOrder: (max._max.sortOrder ?? -1) + 1 },
  });
  await logAudit({ action: "product.image_add", entity: "product", entityId: productId });
  await touchParent("product", productId, tenantId);
  revalidatePath(`/products/${productId}/edit`);
}

export async function removeProductImage(productId: string, imageId: string) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(productId, tenantId);
  await captureRevision("product", productId, "child");
  await prisma.productImage.deleteMany({ where: { id: imageId, productId } });
  await logAudit({ action: "product.image_remove", entity: "product", entityId: productId });
  await touchParent("product", productId, tenantId);
  revalidatePath(`/products/${productId}/edit`);
}

export async function moveProductImage(
  productId: string,
  imageId: string,
  direction: "up" | "down",
) {
  const { tenantId } = await getTenantFromSession();
  await assertOwnership(productId, tenantId);
  await captureRevision("product", productId, "child");

  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  const idx = images.findIndex((i) => i.id === imageId);
  if (idx === -1) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= images.length) return;

  await prisma.$transaction([
    prisma.productImage.update({ where: { id: images[idx].id }, data: { sortOrder: images[swap].sortOrder } }),
    prisma.productImage.update({ where: { id: images[swap].id }, data: { sortOrder: images[idx].sortOrder } }),
  ]);
  await touchParent("product", productId, tenantId);
  revalidatePath(`/products/${productId}/edit`);
}
