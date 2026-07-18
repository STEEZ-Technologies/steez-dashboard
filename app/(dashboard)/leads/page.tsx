import { Inbox } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { getDictionary } from "@/lib/i18n";
import { LeadsTable, type LeadRow } from "@/components/leads/leads-table";

export default async function LeadsPage() {
  const { tenantId } = await getTenantFromSession();
  const dict = await getDictionary();

  const leads = await prisma.lead.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { id: true, name: true, model: true } } },
    take: 200,
  });

  const rows: LeadRow[] = leads.map((l) => ({
    id: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone,
    company: l.company,
    message: l.message,
    status: l.status,
    notes: l.notes,
    country: l.country,
    productId: l.product?.id ?? null,
    productName: l.product?.name ?? null,
    productModel: l.product?.model ?? null,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader
        eyebrow={dict.pages.leads.eyebrow}
        title={dict.pages.leads.title}
        description={
          rows.length === 0
            ? dict.leads.subtitle
            : `${rows.length} ${rows.length === 1 ? dict.leads.countOne : dict.leads.countOther}`
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={dict.leads.emptyTitle}
          description={dict.leads.emptyDesc}
        />
      ) : (
        <LeadsTable leads={rows} />
      )}
    </div>
  );
}
