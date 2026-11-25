"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { isFixedWebsiteText, websiteTextLimit } from "@/lib/kawada-editor";
import { restoreWebsiteCopy, saveWebsiteCopy, type WebsiteCopyEdit, type WebsiteCopyRestore } from "@/lib/website-copy-history";
import { websitePage } from "./content";

function validVersion(version: number) {
  return Number.isInteger(version) && version >= 0 && version < 2147483647;
}

function validEdit(edit: WebsiteCopyEdit) {
  return validVersion(edit.version) && typeof edit.original === "string" && typeof edit.text === "string"
    && Boolean(edit.text.trim()) && edit.text.trim().length <= websiteTextLimit(edit.original);
}

export async function changeCopy(page: string, language: string, position: number, form: FormData) {
  const { where, actor } = await websitePage(page, language);
  const original = form.get("original");
  const versionValue = form.get("version");
  const version = typeof versionValue === "string" && versionValue !== "" ? Number(versionValue) : NaN;
  const text = form.get("text");
  const removing = form.get("operation") === "remove";
  const editor = `/website/${page}?lang=${language}&view=sections`;
  const finish = (status: string) => redirect(status === "removed"
    ? `${editor}&history=removed&status=removed#page-history`
    : `${editor}&status=${status}&selected=${position}#field-${position}`);
  if (!Number.isInteger(position) || isFixedWebsiteText(page, position)) return finish("protected");
  if (typeof original !== "string" || !validVersion(version)) return finish("conflict");
  if (!removing && (typeof text !== "string" || !validEdit({ position, original, text, version }))) {
    return finish("length");
  }
  const result = await saveWebsiteCopy(prisma, where, actor, [{
    position, expected: { text: original, version }, after: removing ? null : (text as string).trim(),
  }]);
  if (result === "saved") {
    await logAudit({
      action: removing ? "websiteCopy.remove" : "websiteCopy.update",
      entity: "websiteCopy",
      entityId: `${page}/${language}/${position}`,
    });
  }
  revalidatePath(`/website/${page}`);
  finish(result === "saved" && removing ? "removed" : result);
}

export async function saveVisualCopy(page: string, language: string, edits: WebsiteCopyEdit[]) {
  const { where, actor } = await websitePage(page, language);
  if (!Array.isArray(edits) || !edits.length || edits.length > 250) return "invalid";
  const positions = new Set<number>();
  for (const edit of edits) {
    if (!edit || !Number.isInteger(edit.position) || positions.has(edit.position)
      || isFixedWebsiteText(page, edit.position) || !validEdit(edit)) return "invalid";
    positions.add(edit.position);
  }
  const result = await saveWebsiteCopy(prisma, where, actor, edits.map(({ position, original, text, version }) => ({
    position, expected: { text: original, version }, after: text.trim(),
  })));
  if (result === "saved") {
    await logAudit({
      action: "websiteCopy.update", entity: "websiteCopy", entityId: `${page}/${language}`,
      detail: [...positions].join(", "),
    });
    revalidatePath(`/website/${page}`);
  }
  return result;
}

export async function restoreCopy(page: string, language: string, restore: WebsiteCopyRestore) {
  const { where, actor } = await websitePage(page, language);
  if (!restore || typeof restore.revisionId !== "string" || !Number.isInteger(restore.position)
    || isFixedWebsiteText(page, restore.position) || !restore.expected || !validVersion(restore.expected.version)
    || (restore.expected.text !== null && typeof restore.expected.text !== "string")) return "invalid";
  const result = await restoreWebsiteCopy(prisma, where, actor, restore);
  if (result === "saved") {
    await logAudit({
      action: "websiteCopy.restore", entity: "websiteCopy", entityId: `${page}/${language}/${restore.position}`,
    });
    revalidatePath(`/website/${page}`);
  }
  return result;
}
