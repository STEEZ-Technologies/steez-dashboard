import { Plus, Package, Download } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/oss";
import { getPublishState } from "@/lib/publish";
import { PublishBanner } from "@/components/shell/publish-banner";
import { PageHeader } from "@/components/shell/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyState } from "@/components/shell/empty-state";
import { getDictionary } from "@/lib/i18n";
import { ProductsTable, type ProductRow } from "@/components/products/products-table";
import { ImportDialog } from "@/components/products/import-dialog";

export default async function ProductsPage() {
  const { tenantId, role } = await getTenantFromSession();
  const dict = await getDictionary();
  const publishState = await getPublishState(tenantId);
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
    slug: p.slug,
    name: p.name,
    model: p.model,
    categoryLabel: p.category?.label ?? null,
    featured: p.featured,
    published: p.published,
    imageUrl: p.imagePath ? getPublicUrl(p.imagePath) : null,
  }));

  return (
    <div>
      <PublishBanner
        pendingCount={publishState.pendingCount}
        configured={publishState.configured}
        canPublish={role === "OWNER"}
      />
      <PageHeader
        eyebrow={dict.pages.products.eyebrow}
        title={dict.pages.products.title}
        description={`${products.length} ${products.length === 1 ? dict.products.countOne : dict.products.countOther}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <LinkButton variant="outline" size="sm" href="/api/products/export">
              <Download /> {dict.actions.export}
            </LinkButton>
            <ImportDialog importLabel={dict.actions.import} />
            <LinkButton href="/products/new">
              <Plus /> {dict.actions.newProduct}
            </LinkButton>
          </div>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={Package}
          title={dict.products.emptyTitle}
          description={dict.products.emptyDesc}
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
