import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/super-admin";
import { PageHeader } from "@/components/shell/page-header";
import { getDictionary } from "@/lib/i18n";
import { TenantsPanel, type TenantRow } from "@/components/admin/tenants-panel";

export default async function AdminPage() {
  // Gate first — this is the only page that reads across tenant boundaries.
  await requireSuperAdmin();
  const dict = await getDictionary();

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { users: true, products: true } },
      users: {
        where: { role: "OWNER" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true, email: true },
      },
    },
  });

  const rows: TenantRow[] = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    userCount: t._count.users,
    productCount: t._count.products,
    createdAt: t.createdAt.toISOString().slice(0, 10),
    ownerId: t.users[0]?.id ?? null,
    ownerEmail: t.users[0]?.email ?? null,
  }));

  return (
    <div>
      <PageHeader
        eyebrow={dict.pages.admin.eyebrow}
        title={dict.pages.admin.title}
        description={dict.admin.subtitle}
      />
      <TenantsPanel tenants={rows} />
    </div>
  );
}
