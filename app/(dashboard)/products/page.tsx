import { Plus, Package } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/oss";
import { PageHeader } from "@/components/shell/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyState } from "@/components/shell/empty-state";
import { getDictionary } from "@/lib/i18n";
import { ProductsTable, type ProductRow } from "@/components/products/products-table";

export default async function ProductsPage() {
  const { tenantId } = await getTenantFromSession();
  const dict = await getDictionary();
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
      include: { category: true },
    }),
    prisma.category.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
      select: { label: true },
    }),
  ]);

  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    model: p.model,
    categoryLabel: p.category?.label ?? null,
    featured: p.featured,
    published: p.published,
    imageUrl: p.imagePath ? getPublicUrl(p.imagePath) : null,
  }));

  return (
    <div>
      <PageHeader
        eyebrow={dict.pages.products.eyebrow}
        title={dict.pages.products.title}
        description={`${products.length} product${products.length === 1 ? "" : "s"} in your catalog.`}
        action={
          <LinkButton href="/products/new">
            <Plus /> {dict.actions.newProduct}
          </LinkButton>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product to start building the catalog buyers will browse."
          action={
            <LinkButton href="/products/new">
              <Plus /> {dict.actions.newProduct}
            </LinkButton>
          }
        />
      ) : (
        <ProductsTable products={rows} categories={categories} />
      )}
    </div>
  );
}
