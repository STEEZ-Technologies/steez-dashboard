import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { getPublishState } from "@/lib/publish";
import { localizedDefaults } from "@/lib/localized";
import { readStats, STAT_COUNT } from "@/lib/home-content";
import { PublishBanner } from "@/components/shell/publish-banner";
import { PageHeader } from "@/components/shell/page-header";
import { ALL_EDIT_LANGS, LanguageScope, LanguageTabs } from "@/components/shared/language-tabs";
import { HomeContentForm } from "@/components/homepage/HomeContentForm";
import { updateHomeContent } from "./actions";

export default async function HomepagePage() {
  const { tenantId, role } = await getTenantFromSession();
  const dict = await getDictionary();
  const [publishState, tenant, home] = await Promise.all([
    getPublishState(tenantId),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { slug: true } }),
    prisma.homeContent.findUnique({ where: { tenantId } }),
  ]);

  // Always four figure cards; blank ones for a tenant with none saved yet.
  const saved = readStats(home?.stats);
  const stats = Array.from({ length: STAT_COUNT }, (_, i) => {
    const s = saved[i];
    return {
      figure: localizedDefaults(s?.figure),
      unit: localizedDefaults(s?.unit),
      label: localizedDefaults(s?.label),
      body: localizedDefaults(s?.body),
      href: s?.href ?? "/",
    };
  });

  return (
    <div>
      <PublishBanner
        pendingCount={publishState.pendingCount}
        configured={publishState.configured}
        canPublish={role === "OWNER"}
      />
      <PageHeader title={dict.homepage.title} description={dict.homepage.subtitle} />
      <LanguageScope langs={tenant.slug === "komibright" ? ALL_EDIT_LANGS : undefined}>
        <LanguageTabs />
        <HomeContentForm
          action={updateHomeContent}
          defaultValues={{
            heroTitle: localizedDefaults(home?.heroTitle),
            heroSub: localizedDefaults(home?.heroSub),
            stats,
          }}
        />
      </LanguageScope>
    </div>
  );
}
