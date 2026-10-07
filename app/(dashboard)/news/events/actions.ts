"use server";

import { getDictionary } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { newsEventInputSchema, type NewsEventInput } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

// Every optional field written explicitly, null when blank — so clearing a
// field in the form clears it here, and switching "When" to "No date" drops
// the dates rather than leaving the old ones behind.
function toData(input: NewsEventInput, published: boolean) {
  const days = input.dating === "DAYS";
  return {
    slug: input.slug,
    kind: input.kind,
    titleEn: input.titleEn,
    titleZh: input.titleZh ?? null,
    placeEn: input.placeEn ?? null,
    placeZh: input.placeZh ?? null,
    booth: input.booth ?? null,
    dating: input.dating,
    startDate: days && input.startDate ? new Date(input.startDate) : null,
    endDate: days && input.endDate ? new Date(input.endDate) : null,
    year: input.dating === "YEAR" ? (input.year ?? null) : null,
    imagePath: input.imagePath ?? null,
    imageAltEn: input.imageAltEn ?? null,
    imageAltZh: input.imageAltZh ?? null,
    published,
  };
}

export async function createNewsEvent(
  _prevState: string | undefined,
  formData: FormData,
) {
  const { tenantId } = await getTenantFromSession();
  const parsed = newsEventInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const taken = await prisma.newsEvent.findFirst({
    where: { tenantId, slug: parsed.data.slug },
  });
  if (taken) return (await getDictionary()).newsEvents.errSlugTaken;

  // New events go to the top: the timeline reads newest first.
  const minSort = await prisma.newsEvent.aggregate({
    where: { tenantId },
    _min: { sortOrder: true },
  });

  const created = await prisma.newsEvent.create({
    data: {
      ...toData(parsed.data, formData.get("published") === "on"),
      tenantId,
      sortOrder: (minSort._min.sortOrder ?? 1) - 1,
    },
  });

  await logAudit({
    action: "newsEvent.create",
    entity: "newsEvent",
    entityId: created.id,
    detail: created.titleEn,
  });
  revalidatePath("/news");
  redirect("/news?flash=" + encodeURIComponent("Event created"));
}

export async function updateNewsEvent(
  id: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const { tenantId } = await getTenantFromSession();
  const parsed = newsEventInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const taken = await prisma.newsEvent.findFirst({
    where: { tenantId, slug: parsed.data.slug, id: { not: id } },
  });
  if (taken) return (await getDictionary()).newsEvents.errSlugTaken;

  await prisma.newsEvent.updateMany({
    where: { id, tenantId },
    data: toData(parsed.data, formData.get("published") === "on"),
  });

  await logAudit({
    action: "newsEvent.update",
    entity: "newsEvent",
    entityId: id,
    detail: parsed.data.titleEn,
  });
  revalidatePath("/news");
  redirect("/news?flash=" + encodeURIComponent("Event updated"));
}

export async function deleteNewsEvent(id: string) {
  const { tenantId } = await getTenantFromSession();
  await prisma.newsEvent.deleteMany({ where: { id, tenantId } });
  await logAudit({ action: "newsEvent.delete", entity: "newsEvent", entityId: id });
  revalidatePath("/news");
}

export async function moveNewsEvent(id: string, direction: "up" | "down") {
  const { tenantId } = await getTenantFromSession();

  const events = await prisma.newsEvent.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= events.length) return;

  const current = events[index];
  const swap = events[swapIndex];

  await prisma.$transaction([
    prisma.newsEvent.update({ where: { id: current.id }, data: { sortOrder: swap.sortOrder } }),
    prisma.newsEvent.update({ where: { id: swap.id }, data: { sortOrder: current.sortOrder } }),
  ]);

  revalidatePath("/news");
}
