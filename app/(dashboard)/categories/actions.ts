"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { categoryInputSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function createCategory(
  _prevState: string | undefined,
  formData: FormData,
) {
  const { tenantId } = await getTenantFromSession();
  const parsed = categoryInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const maxSort = await prisma.category.aggregate({
    where: { tenantId },
    _max: { sortOrder: true },
  });

  const created = await prisma.category.create({
    data: {
      ...parsed.data,
      tenantId,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  await logAudit({
    action: "category.create",
    entity: "category",
    entityId: created.id,
    detail: created.label,
  });
  revalidatePath("/categories");
  redirect("/categories?flash=" + encodeURIComponent("Category created"));
}

export async function updateCategory(
  id: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const { tenantId } = await getTenantFromSession();
  const parsed = categoryInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.category.updateMany({
    where: { id, tenantId },
    data: parsed.data,
  });

  await logAudit({
    action: "category.update",
    entity: "category",
    entityId: id,
    detail: parsed.data.label,
  });
  revalidatePath("/categories");
  redirect("/categories?flash=" + encodeURIComponent("Category updated"));
}

export async function deleteCategory(id: string) {
  const { tenantId } = await getTenantFromSession();
  await prisma.category.deleteMany({ where: { id, tenantId } });
  await logAudit({ action: "category.delete", entity: "category", entityId: id });
  revalidatePath("/categories");
}

export async function moveCategory(id: string, direction: "up" | "down") {
  const { tenantId } = await getTenantFromSession();

  const categories = await prisma.category.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= categories.length) return;

  const current = categories[index];
  const swap = categories[swapIndex];

  await prisma.$transaction([
    prisma.category.update({
      where: { id: current.id },
      data: { sortOrder: swap.sortOrder },
    }),
    prisma.category.update({
      where: { id: swap.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);

  revalidatePath("/categories");
}

// Drag-drop reorder: persist a full ordered id list as sequential sortOrder.
export async function reorderCategories(orderedIds: string[]) {
  const { tenantId } = await getTenantFromSession();
  const owned = await prisma.category.findMany({
    where: { tenantId, id: { in: orderedIds } },
    select: { id: true },
  });
  const ownedSet = new Set(owned.map((c) => c.id));
  const ids = orderedIds.filter((id) => ownedSet.has(id));

  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.category.update({ where: { id }, data: { sortOrder: i } }),
    ),
  );
  await logAudit({ action: "category.reorder", entity: "category" });
  revalidatePath("/categories");
}
