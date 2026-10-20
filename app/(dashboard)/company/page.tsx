import { Plus } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { getPublishState } from "@/lib/publish";
import { localizedDefaults, readLocalized } from "@/lib/localized";
import { PublishBanner } from "@/components/shell/publish-banner";
import { PageHeader } from "@/components/shell/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { ALL_EDIT_LANGS, LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { CompanyForm } from "@/components/company/CompanyForm";
import { OfficesTable, type OfficeRow } from "@/components/company/offices-table";
import { updateCompanyProfile } from "./actions";

export default async function CompanyPage() {
  const { tenantId, role } = await getTenantFromSession();
  const dict = await getDictionary();
  const t = dict.company;
  const canEdit = role === "OWNER";
  const [publishState, tenant, profile, offices] = await Promise.all([
    getPublishState(tenantId),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { slug: true } }),
    prisma.companyProfile.findUnique({ where: { tenantId } }),
    prisma.office.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" } }),
  ]);

  const socials = Array.isArray(profile?.socials)
    ? (profile.socials as { network: string; url: string }[]).map((s) => `${s.network} ${s.url}`).join("\n")
    : "";

  const rows: OfficeRow[] = offices.map((o) => {
    const name = readLocalized(o.name);
    return {
      id: o.id,
      nameEn: name?.en ?? o.key,
      nameZh: name?.zh ?? null,
      addressEn: readLocalized(o.address)?.en ?? "",
      showMap: o.showMap,
      published: o.published,
    };
  });

  return (
    <div>
      <PublishBanner
        pendingCount={publishState.pendingCount}
        configured={publishState.configured}
        canPublish={canEdit}
      />
      <PageHeader title={t.title} description={t.subtitle} />
      {!canEdit && <p className="mb-4 text-sm text-muted-foreground">{t.readOnly}</p>}

      {/* KomiBright's site is published in six languages (see the product
          edit page); every other tenant keeps English and Chinese. */}
      <LanguageScope langs={tenant.slug === "komibright" ? ALL_EDIT_LANGS : undefined}>
        <LanguageTabs />
        <CompanyForm
          action={updateCompanyProfile}
          canEdit={canEdit}
          defaultValues={{
            email: profile?.email ?? "",
            phone: profile?.phone ?? "",
            whatsapp: profile?.whatsapp ?? "",
            icpNumber: profile?.icpNumber ?? "",
            catalogueUrl: profile?.catalogueUrl ?? "",
            replyWithin: localizedDefaults(profile?.replyWithin),
            footerAddress: localizedDefaults(profile?.footerAddress),
            salesName: profile?.salesName ?? "",
            salesRole: localizedDefaults(profile?.salesRole),
            salesBase: localizedDefaults(profile?.salesBase),
            salesWhatsapp: profile?.salesWhatsapp ?? "",
            salesEmail: profile?.salesEmail ?? "",
            salesWeb: profile?.salesWeb ?? "",
            socials,
          }}
        />
      </LanguageScope>

      <section className="mt-10 max-w-2xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{t.officesTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.officesSubtitle}</p>
          </div>
          {canEdit && (
            <LinkButton href="/company/offices/new">
              <Plus /> {t.newOffice}
            </LinkButton>
          )}
        </div>
        <OfficesTable offices={rows} canEdit={canEdit} />
      </section>
    </div>
  );
}
