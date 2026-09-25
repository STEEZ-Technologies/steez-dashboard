"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { guideInputSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

function extractGuideExtras(formData: FormData) {
  const reader = (formData.get("reader") as string | null) ?? "BOTH";
  const published = formData.get("published") === "on";
  const minutesRaw = formData.get("minutes");
  const minutes = typeof minutesRaw === "string" && minutesRaw !== "" ? Number(minutesRaw) : 5;
  return { reader, published, minutes: Number.isFinite(minutes) ? minutes : 5 };
}

export async function createGuide(
  _prevState: string | undefined,
  formData: FormData,
) {
  const { tenantId } = await getTenantFromSession();
  const parsed = guideInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const { reader, published, minutes } = extractGuideExtras(formData);

  const maxSort = await prisma.guide.aggregate({
    where: { tenantId },
    _max: { sortOrder: true },
  });

  const created = await prisma.guide.create({
    data: {
      ...parsed.data,
      tenantId,
      reader: reader as "DISTRIBUTOR" | "CUSTOMER" | "BOTH",
      published,
      minutes,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  await logAudit({
    action: "guide.create",
    entity: "guide",
    entityId: created.id,
    detail: created.titleEn,
  });
  revalidatePath("/resources");
  redirect("/resources?flash=" + encodeURIComponent("Guide created"));
}

export async function updateGuide(
  id: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const { tenantId } = await getTenantFromSession();
  const parsed = guideInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const { reader, published, minutes } = extractGuideExtras(formData);

  await prisma.guide.updateMany({
    where: { id, tenantId },
    data: {
      ...parsed.data,
      reader: reader as "DISTRIBUTOR" | "CUSTOMER" | "BOTH",
      published,
      minutes,
    },
  });

  await logAudit({
    action: "guide.update",
    entity: "guide",
    entityId: id,
    detail: parsed.data.titleEn,
  });
  revalidatePath("/resources");
  redirect("/resources?flash=" + encodeURIComponent("Guide updated"));
}

export async function deleteGuide(id: string) {
  const { tenantId } = await getTenantFromSession();
  await prisma.guide.deleteMany({ where: { id, tenantId } });
  await logAudit({ action: "guide.delete", entity: "guide", entityId: id });
  revalidatePath("/resources");
}

export async function moveGuide(id: string, direction: "up" | "down") {
  const { tenantId } = await getTenantFromSession();

  const guides = await prisma.guide.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });
  const index = guides.findIndex((g) => g.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= guides.length) return;

  const current = guides[index];
  const swap = guides[swapIndex];

  await prisma.$transaction([
    prisma.guide.update({ where: { id: current.id }, data: { sortOrder: swap.sortOrder } }),
    prisma.guide.update({ where: { id: swap.id }, data: { sortOrder: current.sortOrder } }),
  ]);

  revalidatePath("/resources");
}

export async function reorderGuides(orderedIds: string[]) {
  const { tenantId } = await getTenantFromSession();
  const owned = await prisma.guide.findMany({
    where: { tenantId, id: { in: orderedIds } },
    select: { id: true },
  });
  const ownedSet = new Set(owned.map((g) => g.id));
  const ids = orderedIds.filter((id) => ownedSet.has(id));

  await prisma.$transaction(
    ids.map((id, i) => prisma.guide.update({ where: { id }, data: { sortOrder: i } })),
  );
  await logAudit({ action: "guide.reorder", entity: "guide" });
  revalidatePath("/resources");
}
