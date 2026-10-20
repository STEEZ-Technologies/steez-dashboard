import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { PageHeader } from "@/components/shell/page-header";
import { ALL_EDIT_LANGS, LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { OfficeForm } from "@/components/company/OfficeForm";
import { createOffice } from "../../actions";

export default async function NewOfficePage() {
  const { tenantId, role } = await getTenantFromSession();
  const t = (await getDictionary()).company;
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { slug: true } });
  const canEdit = role === "OWNER";
  return (
    <div>
      <PageHeader title={t.newTitle} />
      {!canEdit && <p className="mb-4 text-sm text-muted-foreground">{t.readOnly}</p>}
      <LanguageScope langs={tenant.slug === "komibright" ? ALL_EDIT_LANGS : undefined}>
        <LanguageTabs />
        <OfficeForm action={createOffice} submitLabel={t.newOffice} canEdit={canEdit} />
      </LanguageScope>
    </div>
  );
}
