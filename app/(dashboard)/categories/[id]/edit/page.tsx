import { notFound } from "next/navigation";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { PageHeader } from "@/components/shell/page-header";
import { updateCategory } from "../../actions";
import { HistoryCard } from "@/components/shared/HistoryCard";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenantId } = await getTenantFromSession();
  const category = await prisma.category.findFirst({ where: { id, tenantId } });
  if (!category) notFound();

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Edit category" />
      <CategoryForm
        action={updateCategory.bind(null, category.id)}
        defaultValues={{
          slug: category.slug,
          label: category.label,
          description: category.description ?? "",
        }}
        submitLabel="Save changes"
      />

      <HistoryCard entity="category" id={category.id} />
    </div>
  );
}
