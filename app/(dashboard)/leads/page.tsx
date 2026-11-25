import Link from "next/link";
import { redirect, RedirectType } from "next/navigation";
import { Inbox } from "lucide-react";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { EnquiryInboxFilters } from "@/components/leads/enquiry-inbox-filters";
import { enquiryHref, enquiryWhere, ENQUIRY_PAGE_SIZE, OPEN_LEAD_STATUSES, parseEnquiryQuery } from "@/lib/enquiry-query";
import { linkedEnquirySessions, sourceCondition } from "@/lib/enquiry-attribution-query";
import { type EnquirySearch } from "@/lib/kawada-enquiry-options";
import { getDictionary, getLocale } from "@/lib/i18n";
import { LeadsTable, type LeadRow } from "@/components/leads/leads-table";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<EnquirySearch> }) {
  const { tenantId } = await getTenantFromSession();
  const [dict, locale, tenant, search] = await Promise.all([
    getDictionary(),
    getLocale(),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { slug: true } }),
    searchParams,
  ]);
  const isKawada = tenant.slug === "kawada";
  const query = parseEnquiryQuery(search, isKawada);
  const filtered = Object.keys(query.parameters).length > 0;
  const where = enquiryWhere(tenantId, query);
  const [source, linked] = await Promise.all([
    query.source ? sourceCondition(where, query.source.value, query.report === "kawada") : null,
    query.unattributed ? linkedEnquirySessions(tenantId) : null,
  ]);
  const matching = {
    ...where,
    AND: [
      ...where.AND,
      ...(source ? [source] : []),
      ...(linked ? [{ OR: [{ sessionId: null }, { sessionId: { notIn: linked } }] }] : []),
    ],
  };
  const { leads, total, open, won, page, pages } = await prisma.$transaction(async (db) => {
    const totals = await db.lead.groupBy({ by: ["status"], where: matching, _count: { _all: true } });
    const total = totals.reduce((sum, row) => sum + row._count._all, 0);
    const open = totals.filter(({ status }) => OPEN_LEAD_STATUSES.some((value) => value === status))
      .reduce((sum, row) => sum + row._count._all, 0);
    const won = totals.find(({ status }) => status === "WON")?._count._all ?? 0;
    const pages = Math.max(1, Math.ceil(total / ENQUIRY_PAGE_SIZE));
    const page = Math.min(query.requestedPage, pages);
    const leads = await db.lead.findMany({
      where: matching,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { product: { select: { id: true, name: true, model: true } } },
      skip: (page - 1) * ENQUIRY_PAGE_SIZE,
      take: ENQUIRY_PAGE_SIZE,
    });
    return { leads, total, open, won, page, pages };
  }, { isolationLevel: "RepeatableRead" });
  const pageHref = (value: number) => enquiryHref({ ...query.parameters, page: value > 1 ? String(value) : "" });
  if (search.page !== undefined && search.page !== String(page)) redirect(pageHref(page), RedirectType.replace);

  const rows: LeadRow[] = leads.map((l) => ({
    id: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone,
    company: l.company,
    message: l.message,
    status: l.status,
    notes: l.notes,
    dealValue: l.dealValue != null ? Number(l.dealValue) : null,
    dealCurrency: l.dealCurrency,
    country: l.country,
    buyerCountry: l.buyerCountry,
    productInterest: l.productInterest,
    orderVolume: l.orderVolume,
    formLanguage: l.formLanguage,
    productId: l.product?.id ?? null,
    productName: l.product?.name ?? null,
    productModel: l.product?.model ?? null,
    createdAt: l.createdAt.toISOString(),
  }));

  const t = dict.leads;
  const n = new Intl.NumberFormat(locale);
  const now = new Date().getTime();
  const first = (page - 1) * ENQUIRY_PAGE_SIZE + 1;
  const count = filtered
    ? (total === 1 ? t.matchingOne : t.matchingOther)
    : (total === 1 ? t.countOne : t.countOther);

  return (
    <div>
      <PageHeader
        eyebrow={dict.pages.leads.eyebrow}
        title={dict.pages.leads.title}
        description={`${n.format(total)} ${count} · ${n.format(open)} ${t.openCount} · ${n.format(won)} ${t.wonCount}`}
      />
      <EnquiryInboxFilters query={query} isKawada={isKawada} dict={dict} locale={locale} />
      {rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={filtered ? dict.enquiryAnalytics.noMatches : t.emptyTitle}
          description={filtered ? undefined : t.emptyDesc}
        />
      ) : (
        <>
          <LeadsTable leads={rows} showBuyerFields={isKawada} keepNew={query.status === "NEW"} now={now} />
          <nav aria-label={t.pagination} className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p>{t.pageRange.replace("{first}", n.format(first)).replace("{last}", n.format(first + rows.length - 1)).replace("{total}", n.format(total))}</p>
            <div className="flex gap-4">
              {page > 1 && <Link className="underline" href={pageHref(page - 1)}>{t.previousPage}</Link>}
              {page < pages && <Link className="underline" href={pageHref(page + 1)}>{t.nextPage}</Link>}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
