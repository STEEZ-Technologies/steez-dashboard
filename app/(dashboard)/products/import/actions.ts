"use server";

import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type ImportRow = {
  slug: string;
  model: string;
  name: string;
  description: string;
  category: string;
  specs: string;
  featured: string;
  published: string;
};

export type ImportSummary = {
  created: number;
  updated: number;
  errors: { row: number; reason: string }[];
};

const SLUG_RE = /^[a-z0-9-]+$/;

export async function importProductsCsv(rows: ImportRow[]): Promise<ImportSummary> {
  const { tenantId } = await getTenantFromSession();
  const summary: ImportSummary = { created: 0, updated: 0, errors: [] };
  if (rows.length === 0) return summary;

  const categories = await prisma.category.findMany({ where: { tenantId } });
  const categoryByLabel = new Map(
    categories.map((c) => [c.label.trim().toLowerCase(), c.id]),
  );

  const maxSort = await prisma.product.aggregate({
    where: { tenantId },
    _max: { sortOrder: true },
  });
  let nextSort = (maxSort._max.sortOrder ?? -1) + 1;

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2; // account for header row, 1-indexed
    const slug = row.slug?.trim().toLowerCase();
    if (!slug || !SLUG_RE.test(slug)) {
      summary.errors.push({ row: rowNum, reason: `Invalid slug "${row.slug}"` });
      continue;
    }
    if (!row.model?.trim() || !row.name?.trim()) {
      summary.errors.push({ row: rowNum, reason: "Model and name are required" });
      continue;
    }

    let specs: unknown = {};
    if (row.specs?.trim()) {
      try {
        specs = JSON.parse(row.specs);
      } catch {
        summary.errors.push({ row: rowNum, reason: "Specs column is not valid JSON" });
        continue;
      }
    }

    const categoryId = row.category?.trim()
      ? (categoryByLabel.get(row.category.trim().toLowerCase()) ?? null)
      : null;

    const data = {
      model: row.model.trim(),
      name: row.name.trim(),
      description: row.description?.trim() || null,
      categoryId,
      specs: specs as object,
      featured: row.featured?.trim().toLowerCase() === "true",
      published: row.published?.trim().toLowerCase() !== "false",
    };

    const existing = await prisma.product.findFirst({
      where: { tenantId, slug },
      select: { id: true },
    });

    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
      summary.updated++;
    } else {
      await prisma.product.create({
        data: { ...data, tenantId, slug, sortOrder: nextSort++ },
      });
      summary.created++;
    }
  }

  await logAudit({
    action: "product.bulk_import",
    entity: "product",
    detail: `${summary.created} created, ${summary.updated} updated, ${summary.errors.length} errors`,
  });
  revalidatePath("/products");
  return summary;
}
