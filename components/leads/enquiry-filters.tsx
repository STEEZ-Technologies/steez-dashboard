import { ENQUIRY_FIELDS, ENQUIRY_OPTIONS, type EnquiryFilters } from "@/lib/kawada-enquiry-options";
import { enquiryLabel } from "@/lib/kawada-enquiry-labels";
import type { Dictionary, Locale } from "@/lib/i18n";

export function EnquiryFiltersForm({
  action, filters, range, dict, locale,
}: {
  action: "/" | "/leads";
  filters: EnquiryFilters;
  range?: string;
  dict: Dictionary;
  locale: Locale;
}) {
  const t = dict.enquiryAnalytics;
  return (
    <form key={JSON.stringify(filters)} action={action} method="get" className="mb-4 rounded-lg border p-3">
      {range && <input type="hidden" name="range" value={range} />}
      <EnquiryFilterFields filters={filters} dict={dict} locale={locale} />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">{t.apply}</button>
        {Object.keys(filters).length > 0 && (
          <a href={range ? `${action}?range=${range}` : action} className="text-sm underline underline-offset-4">{t.clear}</a>
        )}
      </div>
    </form>
  );
}

export function EnquiryFilterFields({ filters, dict, locale }: {
  filters: EnquiryFilters;
  dict: Dictionary;
  locale: Locale;
}) {
  const t = dict.enquiryAnalytics;
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <legend className="mb-2 text-sm font-semibold">{t.filters}</legend>
      {ENQUIRY_FIELDS.map((field) => {
        const options = ENQUIRY_OPTIONS[field].map((value) => ({
          value, label: enquiryLabel(field, value, dict, locale),
        }));
        if (field === "buyerCountry") options.sort((a, b) => a.label.localeCompare(b.label, locale));
        return (
          <label className="flex min-w-0 flex-col gap-1 text-sm" key={field}>
            {t.fields[field]}
            <select name={field} defaultValue={filters[field] ?? ""} className="h-9 min-w-0 rounded-md border bg-background px-2 text-sm">
              <option value="">{t.all}</option>
              {options.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        );
        })}
      </fieldset>
  );
}
