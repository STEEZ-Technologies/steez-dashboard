"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { productInputSchema } from "@/lib/validation";
import { parseSpecsText } from "@/lib/specs";
import { logAudit } from "@/lib/audit";

function extractProductExtras(formData: FormData) {
  const categoryIdRaw = formData.get("categoryId");
  const categoryId =
    typeof categoryIdRaw === "string" && categoryIdRaw !== ""
      ? categoryIdRaw
      : null;
  const featured = formData.get("featured") === "on";
  const published = formData.get("published") === "on";
  const specsText = (formData.get("specsText") as string | null) ?? "";
  const specs = parseSpecsText(specsText);
  return { categoryId, featured, published, specs };
}

export async function createProduct(
  _prevState: string | undefined,
  formData: FormData,
) {
  const { tenantId } = await getTenantFromSession();
  const parsed = productInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const { categoryId, featured, published, specs } =
    extractProductExtras(formData);

  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, tenantId },
    });
    if (!category) return "Invalid category";
  }

  const maxSort = await prisma.product.aggregate({
    where: { tenantId },
    _max: { sortOrder: true },
  });

  const created = await prisma.product.create({
    data: {
      ...parsed.data,
      tenantId,
      categoryId,
      featured,
      published,
      specs,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  await logAudit({
    action: "product.create",
    entity: "product",
    entityId: created.id,
    detail: created.name,
  });
  revalidatePath("/products");
  redirect("/products?flash=" + encodeURIComponent("Product created"));
}

export async function updateProduct(
  id: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const { tenantId } = await getTenantFromSession();
  const parsed = productInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const { categoryId, featured, published, specs } =
    extractProductExtras(formData);

  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, tenantId },
    });
    if (!category) return "Invalid category";
  }

  await prisma.product.updateMany({
    where: { id, tenantId },
    data: { ...parsed.data, categoryId, featured, published, specs },
  });

  await logAudit({
    action: "product.update",
    entity: "product",
    entityId: id,
    detail: parsed.data.name,
  });
  revalidatePath("/products");
  redirect("/products?flash=" + encodeURIComponent("Product updated"));
}

export async function deleteProduct(id: string) {
  const { tenantId } = await getTenantFromSession();
  await prisma.product.deleteMany({ where: { id, tenantId } });
  await logAudit({ action: "product.delete", entity: "product", entityId: id });
  revalidatePath("/products");
}

export async function duplicateProduct(id: string) {
  const { tenantId } = await getTenantFromSession();
  const src = await prisma.product.findFirst({
    where: { id, tenantId },
    include: { finishes: true },
  });
  if (!src) return;

  // ensure a unique slug
  let slug = `${src.slug}-copy`;
  let n = 2;
  while (await prisma.product.findFirst({ where: { tenantId, slug } })) {
    slug = `${src.slug}-copy-${n++}`;
  }

  const maxSort = await prisma.product.aggregate({
    where: { tenantId },
    _max: { sortOrder: true },
  });

  await prisma.product.create({
    data: {
      tenantId,
      categoryId: src.categoryId,
      slug,
      model: src.model,
      name: `${src.name} (copy)`,
      description: src.description,
      imagePath: src.imagePath,
      specs: src.specs ?? undefined,
      featured: false,
      published: false,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      finishes: {
        create: src.finishes.map((f) => ({
          key: f.key,
          materialLabel: f.materialLabel,
          imagePath: f.imagePath,
          accentHex: f.accentHex,
          sortOrder: f.sortOrder,
        })),
      },
    },
  });

  await logAudit({
    action: "product.duplicate",
    entity: "product",
    entityId: id,
    detail: `→ ${slug}`,
  });
  revalidatePath("/products");
}

export async function moveProduct(id: string, direction: "up" | "down") {
  const { tenantId } = await getTenantFromSession();

  const products = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= products.length) return;

  const current = products[index];
  const swap = products[swapIndex];

  await prisma.$transaction([
    prisma.product.update({
      where: { id: current.id },
      data: { sortOrder: swap.sortOrder },
    }),
    prisma.product.update({
      where: { id: swap.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);

  revalidatePath("/products");
}

// Drag-drop reorder: persist a full ordered id list as sequential sortOrder.
export async function reorderProducts(orderedIds: string[]) {
  const { tenantId } = await getTenantFromSession();
  // Only ids that actually belong to this tenant.
  const owned = await prisma.product.findMany({
    where: { tenantId, id: { in: orderedIds } },
    select: { id: true },
  });
  const ownedSet = new Set(owned.map((p) => p.id));
  const ids = orderedIds.filter((id) => ownedSet.has(id));

  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.product.update({ where: { id }, data: { sortOrder: i } }),
    ),
  );
  await logAudit({ action: "product.reorder", entity: "product" });
  revalidatePath("/products");
}

export async function bulkUpdateProducts(
  ids: string[],
  patch: { published?: boolean; featured?: boolean },
) {
  const { tenantId } = await getTenantFromSession();
  if (ids.length === 0) return;
  await prisma.product.updateMany({
    where: { id: { in: ids }, tenantId },
    data: patch,
  });
  await logAudit({
    action: "product.bulk_update",
    entity: "product",
    detail: `${ids.length} items ${JSON.stringify(patch)}`,
  });
  revalidatePath("/products");
}

export async function bulkDeleteProducts(ids: string[]) {
  const { tenantId } = await getTenantFromSession();
  if (ids.length === 0) return;
  await prisma.product.deleteMany({ where: { id: { in: ids }, tenantId } });
  await logAudit({
    action: "product.bulk_delete",
    entity: "product",
    detail: `${ids.length} items`,
  });
  revalidatePath("/products");
}
