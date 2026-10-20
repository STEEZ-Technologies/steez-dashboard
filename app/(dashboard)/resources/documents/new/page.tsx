import { redirect } from "next/navigation";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import { inDashboardLang } from "@/lib/document-text";
import { PageHeader } from "@/components/shell/page-header";
import { ALL_EDIT_LANGS, LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { DocumentForm } from "@/components/documents/DocumentForm";
import { createDocument } from "../actions";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group } = await searchParams;
  const { tenantId } = await getTenantFromSession();
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const [groups, tenant] = await Promise.all([
    prisma.documentGroup.findMany({ where: { tenantId }, orderBy: [{ section: "asc" }, { sortOrder: "asc" }] }),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { slug: true } }),
  ]);
  // A document needs a group to go in.
  if (groups.length === 0) redirect("/resources/documents/groups/new");
  const options = groups.map((g) => ({ id: g.id, title: inDashboardLang(g.title, locale) }));
  return (
    <div>
      <PageHeader title={dict.documents.newDocumentTitle} />
      <LanguageScope langs={tenant.slug === "komibright" ? ALL_EDIT_LANGS : undefined}>
        <LanguageTabs />
        <DocumentForm
          action={createDocument}
          groups={options}
          defaultValues={{ groupId: groups.some((g) => g.id === group) ? group : undefined }}
          submitLabel={dict.documents.newDocument}
        />
      </LanguageScope>
    </div>
  );
}
