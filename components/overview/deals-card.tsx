import { ArrowRight } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import type { DealStats } from "@/lib/leads-stats";
import type { Dictionary } from "@/lib/i18n";

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="eyebrow">{label}</p>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">{children}</div>
    </div>
  );
}

export function DealsCard({
  stats,
  days,
  dict,
}: {
  stats: DealStats;
  days: number;
  dict: Dictionary;
}) {
  const t = dict.overview;
  const fmt = (currency: string, total: number) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(total);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.dealsTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">{t.dealsSubtitle.replace("{days}", String(days))}</p>
        <CardAction>
          <LinkButton variant="ghost" size="sm" href="/leads">
            {t.viewEnquiries} <ArrowRight />
          </LinkButton>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
          <Figure label={t.dealsEnquiries}>{stats.enquiries}</Figure>
          <Figure label={t.dealsWon}>{stats.won}</Figure>
          <Figure label={t.dealsWinRate}>
            {stats.winRate == null ? "—" : `${stats.winRate}%`}
          </Figure>
          <Figure label={t.dealsWonValue}>
            {stats.wonValue.length === 0 ? (
              "—"
            ) : (
              <div className="flex flex-col gap-0.5">
                {stats.wonValue.map((v) => (
                  <span key={v.currency} className="truncate">
                    {fmt(v.currency, v.total)}
                  </span>
                ))}
              </div>
            )}
          </Figure>
        </div>
        {stats.wonValue.length === 0 && (
          <p className="mt-4 text-xs text-muted-foreground">{t.dealsNoValue}</p>
        )}
      </CardContent>
    </Card>
  );
}
