import { notFound } from "next/navigation";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { localizedDefaults } from "@/lib/localized";
import { PageHeader } from "@/components/shell/page-header";
import { ALL_EDIT_LANGS, LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { DocumentGroupForm } from "@/components/documents/DocumentGroupForm";
import { updateDocumentGroup } from "../../../actions";

export default async function EditDocumentGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await getTenantFromSession();
  const dict = await getDictionary();
  const [group, tenant] = await Promise.all([
    prisma.documentGroup.findFirst({ where: { id, tenantId } }),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { slug: true } }),
  ]);
  if (!group) notFound();
  return (
    <div>
      <PageHeader title={dict.documents.editGroupTitle} />
      <LanguageScope langs={tenant.slug === "komibright" ? ALL_EDIT_LANGS : undefined}>
        <LanguageTabs />
        <DocumentGroupForm
          action={updateDocumentGroup.bind(null, group.id)}
          submitLabel={dict.actions.saveChanges}
          defaultValues={{ section: group.section, title: localizedDefaults(group.title) }}
        />
      </LanguageScope>
    </div>
  );
}
