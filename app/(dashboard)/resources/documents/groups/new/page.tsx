import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { PageHeader } from "@/components/shell/page-header";
import { ALL_EDIT_LANGS, LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { DocumentGroupForm } from "@/components/documents/DocumentGroupForm";
import { createDocumentGroup } from "../../actions";

export default async function NewDocumentGroupPage() {
  const { tenantId } = await getTenantFromSession();
  const t = (await getDictionary()).documents;
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { slug: true } });
  return (
    <div>
      <PageHeader title={t.newGroupTitle} />
      <LanguageScope langs={tenant.slug === "komibright" ? ALL_EDIT_LANGS : undefined}>
        <LanguageTabs />
        <DocumentGroupForm action={createDocumentGroup} submitLabel={t.newGroup} />
      </LanguageScope>
    </div>
  );
}
