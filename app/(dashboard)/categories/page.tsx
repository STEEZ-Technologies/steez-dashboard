import { Plus } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shell/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { getDictionary } from "@/lib/i18n";
import {
  CategoriesTable,
  type CategoryRow,
} from "@/components/categories/categories-table";

export default async function CategoriesPage() {
  const { tenantId } = await getTenantFromSession();
  const dict = await getDictionary();
  const categories = await prisma.category.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  const rows: CategoryRow[] = categories.map((c) => ({
    id: c.id,
    label: c.label,
    slug: c.slug,
    productCount: c._count.products,
  }));

  return (
    <div>
      <PageHeader
        eyebrow={dict.pages.categories.eyebrow}
        title={dict.pages.categories.title}
        description={dict.categories.subtitle}
        action={
          <LinkButton href="/categories/new">
            <Plus /> {dict.actions.newCategory}
          </LinkButton>
        }
      />
      <CategoriesTable categories={rows} />
    </div>
  );
}
