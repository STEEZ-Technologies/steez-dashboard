import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/products/ProductForm";
import { PageHeader } from "@/components/shell/page-header";
import { createProduct } from "../actions";
import { ALL_EDIT_LANGS, LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";

export default async function NewProductPage() {
  const { tenantId } = await getTenantFromSession();
  const [categories, tenant] = await Promise.all([
    prisma.category.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { slug: true } }),
  ]);
  // Same six languages as the edit page for KomiBright (see there).
  const lean = tenant.slug === "komibright";
  const kawada = tenant.slug === "kawada";

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="New product" />
      <LanguageScope langs={lean ? ALL_EDIT_LANGS : kawada ? ["en", "zh", "es"] : undefined}>
        <LanguageTabs />
        <ProductForm
          action={createProduct}
          categories={categories}
          submitLabel="Create product"
          lean={lean}
          kawada={kawada}
          defaultValues={{ published: true }}
        />
      </LanguageScope>
    </div>
  );
}
