"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { finishInputSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

async function assertProductOwnership(productId: string, tenantId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
  });
  if (!product) throw new Error("Product not found");
  return product;
}

export async function createFinish(
  productId: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const { tenantId } = await getTenantFromSession();
  await assertProductOwnership(productId, tenantId);

  const parsed = finishInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const imagePath = formData.get("imagePath") as string;
  if (!imagePath) return "Image is required";

  const maxSort = await prisma.productFinish.aggregate({
    where: { productId },
    _max: { sortOrder: true },
  });

  await prisma.productFinish.create({
    data: {
      ...parsed.data,
      imagePath,
      productId,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  await logAudit({
    action: "finish.create",
    entity: "finish",
    entityId: productId,
    detail: parsed.data.materialLabel,
  });
  revalidatePath(`/products/${productId}/edit`);
  redirect(`/products/${productId}/edit?flash=` + encodeURIComponent("Finish saved"));
}

export async function updateFinish(
  productId: string,
  finishId: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const { tenantId } = await getTenantFromSession();
  await assertProductOwnership(productId, tenantId);

  const parsed = finishInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const imagePath = formData.get("imagePath") as string;
  if (!imagePath) return "Image is required";

  await prisma.productFinish.updateMany({
    where: { id: finishId, productId },
    data: { ...parsed.data, imagePath },
  });

  await logAudit({
    action: "finish.update",
    entity: "finish",
    entityId: finishId,
    detail: parsed.data.materialLabel,
  });
  revalidatePath(`/products/${productId}/edit`);
  redirect(`/products/${productId}/edit?flash=` + encodeURIComponent("Finish saved"));
}

export async function deleteFinish(formData: FormData) {
  const { tenantId } = await getTenantFromSession();
  const productId = formData.get("productId") as string;
  const finishId = formData.get("finishId") as string;
  await assertProductOwnership(productId, tenantId);

  await prisma.productFinish.deleteMany({ where: { id: finishId, productId } });
  await logAudit({ action: "finish.delete", entity: "finish", entityId: finishId });
  revalidatePath(`/products/${productId}/edit`);
}

export async function moveFinish(formData: FormData) {
  const { tenantId } = await getTenantFromSession();
  const productId = formData.get("productId") as string;
  const finishId = formData.get("finishId") as string;
  const direction = formData.get("direction") as "up" | "down";
  await assertProductOwnership(productId, tenantId);

  const finishes = await prisma.productFinish.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  const index = finishes.findIndex((f) => f.id === finishId);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= finishes.length) return;

  const current = finishes[index];
  const swap = finishes[swapIndex];

  await prisma.$transaction([
    prisma.productFinish.update({
      where: { id: current.id },
      data: { sortOrder: swap.sortOrder },
    }),
    prisma.productFinish.update({
      where: { id: swap.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);

  revalidatePath(`/products/${productId}/edit`);
}
