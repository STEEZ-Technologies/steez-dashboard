import { notFound } from "next/navigation";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { localizedDefaults } from "@/lib/localized";
import { PageHeader } from "@/components/shell/page-header";
import { ALL_EDIT_LANGS, LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { OfficeForm } from "@/components/company/OfficeForm";
import { updateOffice } from "../../../actions";

export default async function EditOfficePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId, role } = await getTenantFromSession();
  const dict = await getDictionary();
  const t = dict.company;
  const [office, tenant] = await Promise.all([
    prisma.office.findFirst({ where: { id, tenantId } }),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { slug: true } }),
  ]);
  if (!office) notFound();
  const canEdit = role === "OWNER";

  return (
    <div>
      <PageHeader title={t.editTitle} />
      {!canEdit && <p className="mb-4 text-sm text-muted-foreground">{t.readOnly}</p>}
      <LanguageScope langs={tenant.slug === "komibright" ? ALL_EDIT_LANGS : undefined}>
        <LanguageTabs />
        <OfficeForm
          action={updateOffice.bind(null, office.id)}
          submitLabel={dict.actions.saveChanges}
          canEdit={canEdit}
          defaultValues={{
            key: office.key,
            name: localizedDefaults(office.name),
            company: localizedDefaults(office.company),
            address: localizedDefaults(office.address),
            tel: office.tel ?? "",
            fax: office.fax ?? "",
            email: office.email ?? "",
            web: office.web ?? "",
            line: office.line ?? "",
            lat: office.lat?.toString() ?? "",
            lon: office.lon?.toString() ?? "",
            showMap: office.showMap,
            published: office.published,
          }}
        />
      </LanguageScope>
    </div>
  );
}
