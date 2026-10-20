import { notFound } from "next/navigation";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import { localizedDefaults } from "@/lib/localized";
import { documentUrl } from "@/lib/document-url";
import { inDashboardLang } from "@/lib/document-text";
import { PageHeader } from "@/components/shell/page-header";
import { ALL_EDIT_LANGS, LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { DocumentForm } from "@/components/documents/DocumentForm";
import { updateDocument } from "../../actions";

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await getTenantFromSession();
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const [doc, groups, tenant] = await Promise.all([
    prisma.document.findFirst({ where: { id, tenantId } }),
    prisma.documentGroup.findMany({ where: { tenantId }, orderBy: [{ section: "asc" }, { sortOrder: "asc" }] }),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { slug: true, siteUrl: true } }),
  ]);
  if (!doc) notFound();
  return (
    <div>
      <PageHeader title={dict.documents.editDocumentTitle} />
      <LanguageScope langs={tenant.slug === "komibright" ? ALL_EDIT_LANGS : undefined}>
        <LanguageTabs />
        <DocumentForm
          action={updateDocument.bind(null, doc.id)}
          groups={groups.map((g) => ({ id: g.id, title: inDashboardLang(g.title, locale) }))}
          defaultValues={{
            groupId: doc.groupId,
            label: localizedDefaults(doc.label),
            filePath: doc.filePath,
            published: doc.published,
          }}
          defaultUrl={documentUrl(doc.filePath, tenant.siteUrl)}
          submitLabel={dict.actions.saveChanges}
        />
      </LanguageScope>
    </div>
  );
}
