import { Plus } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getPublishState } from "@/lib/publish";
import { PublishBanner } from "@/components/shell/publish-banner";
import { PageHeader } from "@/components/shell/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { getDictionary } from "@/lib/i18n";
import { ResourcesTable, type GuideRow } from "@/components/resources/resources-table";

export default async function ResourcesPage() {
  const { tenantId, role } = await getTenantFromSession();
  const dict = await getDictionary();
  const publishState = await getPublishState(tenantId);
  const guides = await prisma.guide.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });

  const rows: GuideRow[] = guides.map((g) => ({
    id: g.id,
    titleEn: g.titleEn,
    reader: g.reader,
    published: g.published,
  }));

  return (
    <div>
      <PublishBanner
        pendingCount={publishState.pendingCount}
        configured={publishState.configured}
        canPublish={role === "OWNER"}
      />
      <PageHeader
        eyebrow={dict.pages.resources.eyebrow}
        title={dict.pages.resources.title}
        description={dict.resources.subtitle}
        action={
          <LinkButton href="/resources/new">
            <Plus /> {dict.actions.newGuide}
          </LinkButton>
        }
      />
      <ResourcesTable guides={rows} />
    </div>
  );
}
