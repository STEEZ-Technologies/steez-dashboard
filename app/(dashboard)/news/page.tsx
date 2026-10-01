import { Plus } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getPublishState } from "@/lib/publish";
import { PublishBanner } from "@/components/shell/publish-banner";
import { PageHeader } from "@/components/shell/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { getDictionary } from "@/lib/i18n";
import { ArticlesTable, type ArticleRow } from "@/components/news/articles-table";
import { EventsTable, type NewsEventRow } from "@/components/news/events-table";
import { formatWhen, isUpcoming } from "@/lib/news-events";

export default async function NewsPage() {
  const { tenantId, role } = await getTenantFromSession();
  const dict = await getDictionary();
  const publishState = await getPublishState(tenantId);
  const [articles, newsEvents] = await Promise.all([
    prisma.article.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.newsEvent.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const rows: ArticleRow[] = articles.map((a) => ({
    id: a.id,
    titleEn: a.titleEn,
    topic: a.topic,
    published: a.published,
  }));

  const eventRows: NewsEventRow[] = newsEvents.map((e) => ({
    id: e.id,
    titleEn: e.titleEn,
    kind: e.kind,
    when: formatWhen(e),
    upcoming: isUpcoming(e),
    published: e.published,
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

      <section className="mt-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{dict.newsEvents.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {dict.newsEvents.subtitle}
            </p>
          </div>
          <LinkButton href="/news/events/new" variant="outline" className="self-start sm:self-auto">
            <Plus /> {dict.actions.newEvent}
          </LinkButton>
        </div>
        <EventsTable events={eventRows} />
      </section>
    </div>
  );
}
