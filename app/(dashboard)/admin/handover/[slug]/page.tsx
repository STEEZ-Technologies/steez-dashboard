import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/super-admin";
import { getDictionary } from "@/lib/i18n";
import { PageHeader } from "@/components/shell/page-header";
import { githubConfigured, handoverFor, originsReady, recentRuns } from "@/lib/handover";
import { HandoverPanel } from "@/components/admin/handover-panel";

export default async function HandoverPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireSuperAdmin();
  const { slug } = await params;
  const cfg = handoverFor(slug);
  if (!cfg) notFound();

  const [tenant, dict, runs] = await Promise.all([
    prisma.tenant.findUnique({ where: { slug }, select: { name: true } }),
    getDictionary(),
    recentRuns(cfg),
  ]);
  if (!tenant) notFound();

  return (
    <div>
      <PageHeader
        eyebrow={dict.pages.admin.eyebrow}
        title={dict.handover.title.replace("{name}", tenant.name)}
        description={dict.handover.subtitle}
      />
      <HandoverPanel
        slug={slug}
        name={tenant.name}
        domains={cfg.domains}
        project={cfg.project}
        githubReady={githubConfigured()}
        originsReady={originsReady(cfg)}
        runs={runs}
      />
    </div>
  );
}
