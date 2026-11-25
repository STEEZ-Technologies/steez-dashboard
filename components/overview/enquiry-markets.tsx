import Link from "next/link";
import { enquiryHref, reportParameters, type EnquiryPeriod } from "@/lib/enquiry-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketRow } from "@/lib/leads-stats";
import type { Dictionary, Locale } from "@/lib/i18n";

function MarketList({
  title,
  rows,
  nameOf,
  period,
  field,
  showRate,
  dict,
}: {
  title: string;
  rows: MarketRow[];
  period: EnquiryPeriod;
  field: "country" | "source";
  nameOf: (key: string) => string;
  showRate: boolean;
  dict: Dictionary;
}) {
  const t = dict.overview;
  const max = Math.max(...rows.map((r) => r.enquiries), 1);
  return (
    <div className="min-w-0">
      <p className="eyebrow mb-2">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.marketsEmpty}</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.key} className="relative">
              <div className="flex items-center justify-between gap-3 px-2.5 py-1.5">
                <span className="z-10 min-w-0 truncate text-sm font-medium">{nameOf(r.key)}</span>
                <span className="z-10 shrink-0 text-xs tabular-nums text-muted-foreground">
                  <Link prefetch={false} className="text-sm text-foreground underline" aria-label={`${r.enquiries} ${t.dealsEnquiries} · ${nameOf(r.key)}`}
                    href={enquiryHref({ ...reportParameters("market", period), [field]: r.key })}>{r.enquiries}</Link>
                  {r.won > 0 && (
                    <Link prefetch={false} className="ml-2 text-[var(--chart-2)] underline" aria-label={`${r.won} ${t.marketsWon} · ${nameOf(r.key)}`}
                      href={enquiryHref({ ...reportParameters("market", period), [field]: r.key, status: "WON" })}>
                      {r.won} {t.marketsWon}
                    </Link>
                  )}
                  {showRate && r.rate != null && (
                    <span className="ml-2" title={t.marketsRateHelp}>
                      {r.rate}%
                    </span>
                  )}
                </span>
              </div>
              <div
                className="absolute inset-y-0 left-0 rounded-md bg-[color-mix(in_oklch,var(--chart-2),transparent_84%)]"
                style={{ width: `${(r.enquiries / max) * 100}%` }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Which countries and sources produce enquiries — the buying markets, as
 *  opposed to the visitor breakdowns further down the page. */
export function EnquiryMarkets({
  countries,
  sources,
  period,
  dict,
  locale,
}: {
  countries: MarketRow[];
  sources: MarketRow[];
  period: EnquiryPeriod;
  dict: Dictionary;
  locale: Locale;
}) {
  const t = dict.overview;
  let regionNames: Intl.DisplayNames | null = null;
  try {
    regionNames = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    // Unsupported runtime: fall back to the raw country code.
  }
  const countryName = (code: string) => {
    try {
      return regionNames?.of(code) ?? code;
    } catch {
      return code;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.marketsTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">{t.marketsSubtitle}</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          <MarketList
            title={t.marketsByCountry}
            rows={countries}
            nameOf={countryName}
            period={period}
            field="country"
            showRate
            dict={dict}
          />
          <MarketList
            title={t.marketsBySource}
            rows={sources}
            nameOf={(k) => k}
            period={period}
            field="source"
            showRate={false}
            dict={dict}
          />
        </div>
      </CardContent>
    </Card>
  );
}
