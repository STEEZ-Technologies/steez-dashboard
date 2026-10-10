"use server";

import { getDictionary } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { videoInputSchema, type VideoInput } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

// A Short is a Short if either the link says so or the switch is on — a Short
// shared as an ordinary watch link carries no /shorts/ to read.
function toData(input: VideoInput, formData: FormData) {
  return {
    youtubeId: input.video.id,
    short: input.video.short || formData.get("short") === "on",
    kind: input.kind,
    titleEn: input.titleEn,
    titleZh: input.titleZh ?? null,
    published: formData.get("published") === "on",
  };
}

export async function createVideo(
  _prevState: string | undefined,
  formData: FormData,
) {
  const { tenantId } = await getTenantFromSession();
  const parsed = videoInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const taken = await prisma.video.findFirst({
    where: { tenantId, youtubeId: parsed.data.video.id },
  });
  if (taken) return (await getDictionary()).videos.errTaken;

  // New videos go to the top: the newest is usually the one to show first.
  const minSort = await prisma.video.aggregate({
    where: { tenantId },
    _min: { sortOrder: true },
  });

  const created = await prisma.video.create({
    data: {
      ...toData(parsed.data, formData),
      tenantId,
      sortOrder: (minSort._min.sortOrder ?? 1) - 1,
    },
  });

  await logAudit({
    action: "video.create",
    entity: "video",
    entityId: created.id,
    detail: created.titleEn,
  });
  revalidatePath("/resources");
  redirect("/resources?flash=" + encodeURIComponent("Video added"));
}

export async function updateVideo(
  id: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const { tenantId } = await getTenantFromSession();
  const parsed = videoInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const taken = await prisma.video.findFirst({
    where: { tenantId, youtubeId: parsed.data.video.id, id: { not: id } },
  });
  if (taken) return (await getDictionary()).videos.errTaken;

  await prisma.video.updateMany({
    where: { id, tenantId },
    data: toData(parsed.data, formData),
  });

  await logAudit({
    action: "video.update",
    entity: "video",
    entityId: id,
    detail: parsed.data.titleEn,
  });
  revalidatePath("/resources");
  redirect("/resources?flash=" + encodeURIComponent("Video updated"));
}

export async function deleteVideo(id: string) {
  const { tenantId } = await getTenantFromSession();
  await prisma.video.deleteMany({ where: { id, tenantId } });
  await logAudit({ action: "video.delete", entity: "video", entityId: id });
  revalidatePath("/resources");
}

export async function moveVideo(id: string, direction: "up" | "down") {
  const { tenantId } = await getTenantFromSession();

  const videos = await prisma.video.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });
  const index = videos.findIndex((v) => v.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= videos.length) return;

  const current = videos[index];
  const swap = videos[swapIndex];

  await prisma.$transaction([
    prisma.video.update({ where: { id: current.id }, data: { sortOrder: swap.sortOrder } }),
    prisma.video.update({ where: { id: swap.id }, data: { sortOrder: current.sortOrder } }),
  ]);

  revalidatePath("/resources");
}
