import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

const HEADER = [
  "slug",
  "model",
  "name",
  "description",
  "category",
  "specs",
  "featured",
  "published",
];

// Auth'd, tenant-scoped export of the full product catalog.
export async function GET() {
  const { tenantId } = await getTenantFromSession();
  const products = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
    include: { category: true },
  });

  const rows = products.map((p) => [
    p.slug,
    p.model,
    p.name,
    p.description ?? "",
    p.category?.label ?? "",
    JSON.stringify(p.specs ?? {}),
    p.featured ? "true" : "false",
    p.published ? "true" : "false",
  ]);

  const csv = toCsv([HEADER, ...rows]);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${stamp}.csv"`,
    },
  });
}
