import Link from "next/link";
import { EnquiryFilterFields } from "@/components/leads/enquiry-filters";
import { enquiryHref, LEAD_STATUSES, type parseEnquiryQuery } from "@/lib/enquiry-query";
import { ENQUIRY_FIELDS } from "@/lib/kawada-enquiry-options";
import { enquiryLabel } from "@/lib/kawada-enquiry-labels";
import type { Dictionary, Locale } from "@/lib/i18n";

export function EnquiryInboxFilters({ query, isKawada, dict, locale }: {
  query: ReturnType<typeof parseEnquiryQuery>;
  isKawada: boolean;
  dict: Dictionary;
  locale: Locale;
}) {
  const t = dict.leads;
  const a = dict.enquiryAnalytics;
  const { parameters, period, report, source, country, segment, unattributed } = query;
  const editable = new Set(["q", "status", ...ENQUIRY_FIELDS]);
  const statusLabels = [t.statusNew, t.statusContacted, t.statusQuoted, t.statusWon, t.statusLost, t.statusArchived];
  const clear = (...keys: string[]) => enquiryHref(
    Object.fromEntries(Object.entries(parameters).filter(([key]) => !keys.includes(key))),
  );
  const chips: { label: string; href: string }[] = [];
  if (report && period) {
    const window = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium", timeStyle: "short", timeZone: "UTC",
    }).formatRange(period.start, period.end);
    chips.push({
      label: `${report === "won" ? t.wonInPeriod : t.receivedInPeriod} · ${window} UTC`,
      href: clear("report", "from", "to", "country", "source", "unknownSource", "segmentField", "segmentValue", "segmentEmpty", "segmentMissing", "unattributed",
        ...(report === "market" && query.status === "WON" ? ["status"] : [])),
    });
  }
  if (country) chips.push({ label: `${a.ipCountry} · ${country}`, href: clear("country") });
  if (source) chips.push({ label: `${a.source} · ${source.value ?? a.unknownSource}`, href: clear("source", "unknownSource") });
  if (segment) {
    const label = segment.value ? enquiryLabel(segment.field, segment.value, dict, locale) : a.unknown;
    chips.push({ label: `${a.fields[segment.field]} · ${label}`, href: clear("segmentField", "segmentValue", "segmentEmpty", "segmentMissing") });
  }
  if (unattributed) chips.push({ label: a.unattributed, href: clear("unattributed") });

  return (
    <form key={JSON.stringify(parameters)} action="/leads" method="get" className="mb-4 space-y-3 rounded-lg border p-3">
      {Object.entries(parameters).filter(([key]) => !editable.has(key)).map(([key, value]) => (
        <input type="hidden" key={key} name={key} value={value} />
      ))}
      {chips.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2 text-sm">
          {chips.map(({ label, href }) => (
            <li key={label}><Link className="inline-block rounded-md border px-2 py-1" href={href}
              aria-label={`${t.removeFilter} ${label}`}>{label} <span aria-hidden="true">×</span></Link></li>
          ))}
          <li className="text-muted-foreground">{report === "kawada" ? t.archivedIncluded : t.archivedExcluded}</li>
        </ul>
      )}
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t.searchLabel}
          <input type="search" name="q" defaultValue={query.q} maxLength={200}
            className="h-9 rounded-md border bg-background px-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t.colStatus}
          <select name="status" defaultValue={query.status ?? ""} className="h-9 rounded-md border bg-background px-2">
            <option value="">{t.allStatus}</option>
            {LEAD_STATUSES.map((status, index) => <option key={status} value={status}>{statusLabels[index]}</option>)}
          </select>
        </label>
      </div>
      {isKawada && <EnquiryFilterFields filters={query.filters} dict={dict} locale={locale} />}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">{a.apply}</button>
        {Object.keys(parameters).length > 0 && <Link href="/leads" className="text-sm underline">{a.clear}</Link>}
      </div>
    </form>
  );
}
