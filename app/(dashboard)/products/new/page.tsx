import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/products/ProductForm";
import { PageHeader } from "@/components/shell/page-header";
import { createProduct } from "../actions";

export default async function NewProductPage() {
  const { tenantId } = await getTenantFromSession();
  const categories = await prisma.category.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="New product" />
      <ProductForm
        action={createProduct}
        categories={categories}
        submitLabel="Create product"
        defaultValues={{ published: true }}
      />
    </div>
  );
}
