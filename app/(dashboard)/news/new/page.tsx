import { ArticleForm } from "@/components/news/ArticleForm";
import { PageHeader } from "@/components/shell/page-header";
import { LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { createArticle } from "../actions";

export default function NewArticlePage() {
  return (
    <div>
      <PageHeader eyebrow="Catalog" title="New article" />
      <LanguageScope>
        <LanguageTabs />
        <ArticleForm action={createArticle} submitLabel="Create article" />
      </LanguageScope>
    </div>
  );
}
