import { CategoryForm } from "@/components/categories/CategoryForm";
import { PageHeader } from "@/components/shell/page-header";
import { createCategory } from "../actions";

export default function NewCategoryPage() {
  return (
    <div>
      <PageHeader eyebrow="Catalog" title="New category" />
      <CategoryForm action={createCategory} submitLabel="Create category" />
    </div>
  );
}
