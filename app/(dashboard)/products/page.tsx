import { Plus, Package } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/oss";
import { getPublishState } from "@/lib/publish";
import { PublishBanner } from "@/components/shell/publish-banner";
import { PageHeader } from "@/components/shell/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyState } from "@/components/shell/empty-state";
import { getDictionary } from "@/lib/i18n";
import { productCompleteness } from "@/lib/completeness";
import { ProductsTable, type ProductRow } from "@/components/products/products-table";
import { ProductsMoreMenu } from "@/components/products/products-more-menu";

export default async function ProductsPage() {
  const { tenantId, role } = await getTenantFromSession();
  const dict = await getDictionary();
  const publishState = await getPublishState(tenantId);
  const [products, categories, tenant] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
      include: { category: true, _count: { select: { images: true } } },
    }),
    prisma.category.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
      select: { label: true },
    }),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { siteUrl: true, slug: true } }),
  ]);

  // KomiBright's site shows the gallery, not the main photo (see edit page).
  const lean = tenant.slug === "komibright";
  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    model: p.model,
    categoryLabel: p.category?.label ?? null,
    featured: p.featured,
    published: p.published,
    imageUrl: p.imagePath ? getPublicUrl(p.imagePath) : null,
    completeness: productCompleteness(
      {
        nameZh: p.nameZh,
        description: p.description,
        descriptionZh: p.descriptionZh,
        imagePath: p.imagePath,
        galleryCount: p._count.images,
        categoryId: p.categoryId,
        specs: p.specs,
      },
      { lean },
    ),
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
            <ProductsMoreMenu />
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
        <ProductsTable products={rows} categories={categories} siteUrl={tenant.siteUrl} />
      )}
    </div>
  );
}
