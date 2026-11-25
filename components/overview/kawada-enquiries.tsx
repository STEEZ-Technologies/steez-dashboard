import Link from "next/link";
import { enquiryHref, reportParameters, type EnquiryPeriod } from "@/lib/enquiry-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnquiryFiltersForm } from "@/components/leads/enquiry-filters";
import { ENQUIRY_FIELDS, type EnquiryFilters } from "@/lib/kawada-enquiry-options";
import { enquiryLabel } from "@/lib/kawada-enquiry-labels";
import type { getKawadaEnquiryReport, getKawadaFunnel } from "@/lib/kawada-enquiry-report";
import type { Dictionary, Locale } from "@/lib/i18n";

export function KawadaEnquiries({
  funnel, report, period, filters, range, dict, locale,
}: {
  funnel: Awaited<ReturnType<typeof getKawadaFunnel>>;
  report: Awaited<ReturnType<typeof getKawadaEnquiryReport>>;
  filters: EnquiryFilters;
  range: string;
  period: EnquiryPeriod;
  dict: Dictionary;
  locale: Locale;
}) {
  const t = dict.enquiryAnalytics;
  const n = new Intl.NumberFormat(locale);
  const base = { ...reportParameters("kawada", period), ...filters };
  const countLink = (count: number, label: string, extra: Record<string, string> = {}) => (
    <Link prefetch={false} className="underline underline-offset-4" aria-label={`${n.format(count)} · ${label}`}
      href={enquiryHref({ ...base, ...extra })}>{n.format(count)}</Link>
  );
  const sections = [
    { field: "source", title: t.source, rows: report.sources, label: (key: string | null) => key ?? t.unknownSource },
    ...ENQUIRY_FIELDS.map((field) => ({
      field,
      title: t.fields[field],
      rows: report[field],
      label: (key: string | null) => key ? enquiryLabel(field, key, dict, locale) : t.unknown,
    })),
  ];
  return (
    <div className="my-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.period}</p>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border p-3">
              <dt className="text-sm">{t.visits}</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{n.format(funnel.visits)}</dd>
            </div>
            {(["product", "started", "submitted"] as const).map((step) => (
              <div key={step} className="rounded-lg border p-3">
                <dt className="text-sm">{t[step]}</dt>
                <dd className="mt-1 font-semibold tabular-nums">
                  {funnel.visits ? t.share
                    .replace("{count}", n.format(funnel[step]))
                    .replace("{total}", n.format(funnel.visits))
                    .replace("{percent}", n.format(Math.round(funnel[step] * 100 / funnel.visits))) : "—"}
                </dd>
              </div>
            ))}
          </dl>
          {funnel.visits > 0 ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex gap-2"><dt>{t.submittedWithProduct}</dt><dd className="font-semibold">{n.format(funnel.submittedWithProduct)}</dd></div>
              <div className="flex gap-2"><dt>{t.submittedFromContact}</dt><dd className="font-semibold">{n.format(funnel.submittedFromContact)}</dd></div>
            </dl>
          ) : <p className="mt-4 text-sm text-muted-foreground">{t.emptyVisits}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t.reportTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.reportHelp}</p>
        </CardHeader>
        <CardContent>
          <EnquiryFiltersForm action="/" filters={filters} range={range} dict={dict} locale={locale} />
          <dl className="mb-4 flex flex-wrap gap-5 text-sm">
            <div className="flex gap-2"><dt>{t.reportTitle}</dt><dd className="font-semibold">{countLink(report.total, t.reportTitle)}</dd></div>
            <div className="flex gap-2"><dt>{t.unattributed}</dt><dd className="font-semibold">{countLink(report.unattributed, t.unattributed, { unattributed: "1" })}</dd></div>
          </dl>
          {report.total > 0 ? (
            <div className="grid items-start gap-3 sm:grid-cols-2 2xl:grid-cols-5">
              {sections.map(({ field, title, rows, label }) => (
                <section key={title} className="min-w-0 rounded-lg border p-3">
                  <h3 className="mb-2 text-sm font-semibold">{title}</h3>
                  <dl className="space-y-2 text-sm">
                    {rows.map(({ key, count }) => (
                      <div key={key === null ? "missing" : `value:${key}`} className="flex justify-between gap-2">
                        <dt className="min-w-0 break-words">{label(key)}</dt>
                        <dd className="tabular-nums">{countLink(count, `${title} · ${label(key)}`, field === "source"
                          ? (key === null ? { unknownSource: "1" } : { source: key })
                          : { segmentField: field, ...(key === null ? { segmentMissing: "1" } : key === "" ? { segmentEmpty: "1" } : { segmentValue: key }) })}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">{Object.keys(filters).length ? t.noMatches : t.empty}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
