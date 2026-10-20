"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/app/generated/prisma/client";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { localizedFromForm } from "@/lib/localized";
import { logAudit } from "@/lib/audit";

const PATH = "/resources/documents";

/* A document's file is either this tenant's own upload (an OSS key the
   upload route made) or a file the client's site already serves, kept from
   before the dashboard had documents. Anything else — another tenant's key,
   a link to somewhere else — is refused. */
function validFile(filePath: string, tenantId: string) {
  return (
    new RegExp(`^documents/${tenantId}/[\\w-]+\\.(pdf|jpg|png)$`).test(filePath) ||
    /^\/documents\/[\w.-]+\.(pdf|jpg|png)$/.test(filePath)
  );
}

export async function createDocumentGroup(_prev: string | undefined, formData: FormData) {
  const { tenantId } = await getTenantFromSession();
  const t = (await getDictionary()).documents;
  const title = localizedFromForm(formData, "title");
  if (!title) return t.errTitle;
  const section = formData.get("section") === "COMPANY" ? "COMPANY" : "CERTIFICATES";

  const maxSort = await prisma.documentGroup.aggregate({
    where: { tenantId, section },
    _max: { sortOrder: true },
  });
  const created = await prisma.documentGroup.create({
    data: {
      tenantId,
      section,
      title: title as Prisma.InputJsonObject,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  await logAudit({ action: "documentGroup.create", entity: "documentGroup", entityId: created.id, detail: title.en });
  revalidatePath(PATH);
  redirect(`${PATH}?flash=` + encodeURIComponent("Group added"));
}

export async function updateDocumentGroup(id: string, _prev: string | undefined, formData: FormData) {
  const { tenantId } = await getTenantFromSession();
  const t = (await getDictionary()).documents;
  const title = localizedFromForm(formData, "title");
  if (!title) return t.errTitle;
  const section = formData.get("section") === "COMPANY" ? "COMPANY" : "CERTIFICATES";

  await prisma.documentGroup.updateMany({
    where: { id, tenantId },
    data: { section, title: title as Prisma.InputJsonObject },
  });
  await logAudit({ action: "documentGroup.update", entity: "documentGroup", entityId: id, detail: title.en });
  revalidatePath(PATH);
  redirect(`${PATH}?flash=` + encodeURIComponent("Group updated"));
}

export async function deleteDocumentGroup(id: string) {
  const { tenantId } = await getTenantFromSession();
  // Its documents go with it (onDelete: Cascade).
  await prisma.documentGroup.deleteMany({ where: { id, tenantId } });
  await logAudit({ action: "documentGroup.delete", entity: "documentGroup", entityId: id });
  revalidatePath(PATH);
}

export async function moveDocumentGroup(id: string, direction: "up" | "down") {
  const { tenantId } = await getTenantFromSession();
  const group = await prisma.documentGroup.findFirst({ where: { id, tenantId } });
  if (!group) return;
  // Groups move within their own section.
  const groups = await prisma.documentGroup.findMany({
    where: { tenantId, section: group.section },
    orderBy: { sortOrder: "asc" },
  });
  await swap(groups, id, direction, (a, b) => [
    prisma.documentGroup.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.documentGroup.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidatePath(PATH);
}

async function documentData(formData: FormData, tenantId: string) {
  const t = (await getDictionary()).documents;
  const label = localizedFromForm(formData, "label");
  if (!label) return { error: t.errLabel };
  const filePath = String(formData.get("filePath") ?? "").trim();
  if (!filePath) return { error: t.errFile };
  if (!validFile(filePath, tenantId)) return { error: t.errFile };
  const groupId = String(formData.get("groupId") ?? "");
  const group = await prisma.documentGroup.findFirst({ where: { id: groupId, tenantId } });
  if (!group) return { error: t.errGroup };
  return {
    data: {
      groupId,
      label: label as Prisma.InputJsonObject,
      filePath,
      published: formData.get("published") === "on",
    },
  };
}

export async function createDocument(_prev: string | undefined, formData: FormData) {
  const { tenantId } = await getTenantFromSession();
  const result = await documentData(formData, tenantId);
  if ("error" in result) return result.error;

  const maxSort = await prisma.document.aggregate({
    where: { groupId: result.data.groupId },
    _max: { sortOrder: true },
  });
  const created = await prisma.document.create({
    data: { ...result.data, tenantId, sortOrder: (maxSort._max.sortOrder ?? -1) + 1 },
  });
  await logAudit({
    action: "document.create",
    entity: "document",
    entityId: created.id,
    detail: (result.data.label as { en: string }).en,
  });
  revalidatePath(PATH);
  redirect(`${PATH}?flash=` + encodeURIComponent("Document added"));
}

export async function updateDocument(id: string, _prev: string | undefined, formData: FormData) {
  const { tenantId } = await getTenantFromSession();
  const result = await documentData(formData, tenantId);
  if ("error" in result) return result.error;

  const current = await prisma.document.findFirst({ where: { id, tenantId } });
  if (!current) return (await getDictionary()).documents.errGroup;
  // Moved to another group: it goes to the end of that group.
  const sortOrder =
    current.groupId === result.data.groupId
      ? current.sortOrder
      : ((
          await prisma.document.aggregate({
            where: { groupId: result.data.groupId },
            _max: { sortOrder: true },
          })
        )._max.sortOrder ?? -1) + 1;

  await prisma.document.updateMany({ where: { id, tenantId }, data: { ...result.data, sortOrder } });
  await logAudit({
    action: "document.update",
    entity: "document",
    entityId: id,
    detail: (result.data.label as { en: string }).en,
  });
  revalidatePath(PATH);
  redirect(`${PATH}?flash=` + encodeURIComponent("Document updated"));
}

export async function deleteDocument(id: string) {
  const { tenantId } = await getTenantFromSession();
  await prisma.document.deleteMany({ where: { id, tenantId } });
  await logAudit({ action: "document.delete", entity: "document", entityId: id });
  revalidatePath(PATH);
}

export async function moveDocument(id: string, direction: "up" | "down") {
  const { tenantId } = await getTenantFromSession();
  const doc = await prisma.document.findFirst({ where: { id, tenantId } });
  if (!doc) return;
  const docs = await prisma.document.findMany({
    where: { groupId: doc.groupId },
    orderBy: { sortOrder: "asc" },
  });
  await swap(docs, id, direction, (a, b) => [
    prisma.document.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.document.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidatePath(PATH);
}

async function swap<T extends { id: string; sortOrder: number }>(
  rows: T[],
  id: string,
  direction: "up" | "down",
  updates: (a: T, b: T) => Prisma.PrismaPromise<unknown>[],
) {
  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return;
  const other = direction === "up" ? index - 1 : index + 1;
  if (other < 0 || other >= rows.length) return;
  await prisma.$transaction(updates(rows[index], rows[other]));
}
