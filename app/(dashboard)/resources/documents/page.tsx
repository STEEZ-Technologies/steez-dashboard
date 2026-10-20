import { Plus } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getPublishState } from "@/lib/publish";
import { documentUrl } from "@/lib/document-url";
import { inDashboardLang } from "@/lib/document-text";
import { PublishBanner } from "@/components/shell/publish-banner";
import { PageHeader } from "@/components/shell/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { DocumentsList, type DocumentGroupRow } from "@/components/documents/documents-list";

export default async function DocumentsPage() {
  const { tenantId, role } = await getTenantFromSession();
  const [dict, locale, publishState] = await Promise.all([
    getDictionary(),
    getLocale(),
    getPublishState(tenantId),
  ]);
  const t = dict.documents;
  const [groups, tenant] = await Promise.all([
    prisma.documentGroup.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
      include: { documents: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { siteUrl: true } }),
  ]);

  const rows = (section: "CERTIFICATES" | "COMPANY"): DocumentGroupRow[] =>
    groups
      .filter((g) => g.section === section)
      .map((g) => ({
        id: g.id,
        title: inDashboardLang(g.title, locale),
        documents: g.documents.map((d) => ({
          id: d.id,
          label: inDashboardLang(d.label, locale),
          url: documentUrl(d.filePath, tenant.siteUrl),
          published: d.published,
        })),
      }));

  const section = (key: "CERTIFICATES" | "COMPANY", title: string, help: string) => (
    <section className="mt-8 first:mt-0">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 mb-4 max-w-2xl text-sm text-muted-foreground">{help}</p>
      <DocumentsList groups={rows(key)} />
    </section>
  );

  return (
    <div>
      <PublishBanner
        pendingCount={publishState.pendingCount}
        configured={publishState.configured}
        canPublish={role === "OWNER"}
      />
      <PageHeader
        title={t.title}
        description={t.subtitle}
        action={
          <LinkButton href="/resources/documents/groups/new">
            <Plus /> {t.newGroup}
          </LinkButton>
        }
      />
      {section("CERTIFICATES", t.sectionCertificates, t.sectionCertificatesHelp)}
      {section("COMPANY", t.sectionCompany, t.sectionCompanyHelp)}
    </div>
  );
}
