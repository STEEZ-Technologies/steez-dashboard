"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { companyProfileInputSchema, officeInputSchema } from "@/lib/validation";
import { localizedFromForm, type LocalizedText } from "@/lib/localized";
import { logAudit } from "@/lib/audit";

// Owner-only, like workspace settings: these are where the site sends a
// buyer, and a typo here routes enquiries to the wrong inbox.
async function requireOwner() {
  const session = await getTenantFromSession();
  if (session.role !== "OWNER") return { error: (await getDictionary()).company.errOwnerOnly };
  return { tenantId: session.tenantId };
}

const json = (v: LocalizedText | null) => (v ? (v as Prisma.InputJsonObject) : Prisma.DbNull);

export async function updateCompanyProfile(_prevState: string | undefined, formData: FormData) {
  const owner = await requireOwner();
  if ("error" in owner) return owner.error;
  const { tenantId } = owner;

  const parsed = companyProfileInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";
  const input = parsed.data;

  const data = {
    email: input.email ?? null,
    phone: input.phone ?? null,
    whatsapp: input.whatsapp ?? null,
    icpNumber: input.icpNumber ?? null,
    catalogueUrl: input.catalogueUrl ?? null,
    salesName: input.salesName ?? null,
    salesWhatsapp: input.salesWhatsapp ?? null,
    salesEmail: input.salesEmail ?? null,
    salesWeb: input.salesWeb ?? null,
    socials: input.socials.length > 0 ? (input.socials as Prisma.InputJsonArray) : Prisma.DbNull,
    replyWithin: json(localizedFromForm(formData, "replyWithin")),
    footerAddress: json(localizedFromForm(formData, "footerAddress")),
    salesRole: json(localizedFromForm(formData, "salesRole")),
    salesBase: json(localizedFromForm(formData, "salesBase")),
  };

  await prisma.companyProfile.upsert({
    where: { tenantId },
    create: { tenantId, ...data },
    update: data,
  });

  await logAudit({ action: "company.update", entity: "company", detail: input.email ?? undefined });
  revalidatePath("/company");
  redirect("/company?flash=" + encodeURIComponent("Company details saved"));
}

function officeData(formData: FormData) {
  const parsed = officeInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const name = localizedFromForm(formData, "name");
  const address = localizedFromForm(formData, "address");
  if (!name) return { error: "English name is required" };
  if (!address) return { error: "English address is required" };
  const input = parsed.data;
  // A map needs a point to draw: without coordinates it's left off.
  const hasPoint = input.lat !== undefined && input.lon !== undefined;
  return {
    data: {
      key: input.key,
      name: name as Prisma.InputJsonObject,
      company: json(localizedFromForm(formData, "company")),
      address: address as Prisma.InputJsonObject,
      tel: input.tel ?? null,
      fax: input.fax ?? null,
      email: input.email ?? null,
      web: input.web ?? null,
      line: input.line ?? null,
      lat: input.lat ?? null,
      lon: input.lon ?? null,
      showMap: hasPoint && formData.get("showMap") === "on",
      published: formData.get("published") === "on",
    },
  };
}

export async function createOffice(_prevState: string | undefined, formData: FormData) {
  const owner = await requireOwner();
  if ("error" in owner) return owner.error;
  const { tenantId } = owner;
  const result = officeData(formData);
  if ("error" in result) return result.error;

  const taken = await prisma.office.findFirst({ where: { tenantId, key: result.data.key } });
  if (taken) return (await getDictionary()).company.errKeyTaken;

  const maxSort = await prisma.office.aggregate({ where: { tenantId }, _max: { sortOrder: true } });
  const created = await prisma.office.create({
    data: { ...result.data, tenantId, sortOrder: (maxSort._max.sortOrder ?? -1) + 1 },
  });

  await logAudit({
    action: "office.create",
    entity: "office",
    entityId: created.id,
    detail: (result.data.name as LocalizedText).en,
  });
  revalidatePath("/company");
  redirect("/company?flash=" + encodeURIComponent("Office added"));
}

export async function updateOffice(id: string, _prevState: string | undefined, formData: FormData) {
  const owner = await requireOwner();
  if ("error" in owner) return owner.error;
  const { tenantId } = owner;
  const result = officeData(formData);
  if ("error" in result) return result.error;

  const taken = await prisma.office.findFirst({
    where: { tenantId, key: result.data.key, id: { not: id } },
  });
  if (taken) return (await getDictionary()).company.errKeyTaken;

  await prisma.office.updateMany({ where: { id, tenantId }, data: result.data });

  await logAudit({
    action: "office.update",
    entity: "office",
    entityId: id,
    detail: (result.data.name as LocalizedText).en,
  });
  revalidatePath("/company");
  redirect("/company?flash=" + encodeURIComponent("Office updated"));
}

export async function deleteOffice(id: string) {
  const owner = await requireOwner();
  if ("error" in owner) return;
  const { tenantId } = owner;
  await prisma.office.deleteMany({ where: { id, tenantId } });
  await logAudit({ action: "office.delete", entity: "office", entityId: id });
  revalidatePath("/company");
}

export async function moveOffice(id: string, direction: "up" | "down") {
  const owner = await requireOwner();
  if ("error" in owner) return;
  const { tenantId } = owner;

  const offices = await prisma.office.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" } });
  const index = offices.findIndex((o) => o.id === id);
  if (index === -1) return;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= offices.length) return;

  const current = offices[index];
  const swap = offices[swapIndex];
  await prisma.$transaction([
    prisma.office.update({ where: { id: current.id }, data: { sortOrder: swap.sortOrder } }),
    prisma.office.update({ where: { id: swap.id }, data: { sortOrder: current.sortOrder } }),
  ]);
  revalidatePath("/company");
}
