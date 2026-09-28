import { Plus } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getPublishState } from "@/lib/publish";
import { PublishBanner } from "@/components/shell/publish-banner";
import { PageHeader } from "@/components/shell/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { getDictionary } from "@/lib/i18n";
import { ArticlesTable, type ArticleRow } from "@/components/news/articles-table";

export default async function NewsPage() {
  const { tenantId, role } = await getTenantFromSession();
  const dict = await getDictionary();
  const publishState = await getPublishState(tenantId);
  const articles = await prisma.article.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });

  const rows: ArticleRow[] = articles.map((a) => ({
    id: a.id,
    titleEn: a.titleEn,
    topic: a.topic,
    published: a.published,
  }));

  return (
    <div>
      <PublishBanner
        pendingCount={publishState.pendingCount}
        configured={publishState.configured}
        canPublish={role === "OWNER"}
      />
      <PageHeader
        eyebrow={dict.pages.news.eyebrow}
        title={dict.pages.news.title}
        description={dict.news.subtitle}
        action={
          <LinkButton href="/news/new">
            <Plus /> {dict.actions.newArticle}
          </LinkButton>
        }
      />
      <ArticlesTable articles={rows} />
    </div>
  );
}
