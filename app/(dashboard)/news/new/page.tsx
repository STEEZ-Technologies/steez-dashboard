import { ArticleForm } from "@/components/news/ArticleForm";
import { PageHeader } from "@/components/shell/page-header";
import { createArticle } from "../actions";

export default function NewArticlePage() {
  return (
    <div>
      <PageHeader eyebrow="Catalog" title="New article" />
      <ArticleForm action={createArticle} submitLabel="Create article" />
    </div>
  );
}
