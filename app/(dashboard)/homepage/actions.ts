"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/app/generated/prisma/client";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { homeContentFromForm } from "@/lib/home-content";
import { logAudit } from "@/lib/audit";

export async function updateHomeContent(_prev: string | undefined, formData: FormData) {
  const { tenantId } = await getTenantFromSession();
  const t = (await getDictionary()).homepage;
  const result = homeContentFromForm(formData);
  if ("error" in result) {
    const n = String((result.stat ?? 0) + 1);
    return {
      title: t.errTitle,
      sub: t.errSub,
      figure: t.errFigure,
      label: t.errLabel,
      href: t.errHref,
    }[result.error].replace("{n}", n);
  }

  const data = {
    heroTitle: result.data.heroTitle as Prisma.InputJsonObject,
    heroSub: result.data.heroSub as Prisma.InputJsonObject,
    stats: result.data.stats as unknown as Prisma.InputJsonArray,
  };
  await prisma.homeContent.upsert({ where: { tenantId }, create: { tenantId, ...data }, update: data });
  await logAudit({ action: "homeContent.update", entity: "homeContent", entityId: tenantId, detail: result.data.heroTitle.en });
  revalidatePath("/homepage");
  redirect("/homepage?flash=" + encodeURIComponent(t.saved));
}
