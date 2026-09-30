"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, MousePointerClick, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeadJourney, type LeadJourney } from "@/app/(dashboard)/leads/actions";
import { humanizePath } from "@/lib/analytics-helpers";
import { useT } from "@/lib/i18n/provider";

const ICON = {
  page_view: FileText,
  product_view: Eye,
  product_click: MousePointerClick,
} as const;

const PREVIEW_STEPS = 8;

function shortDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** The visitor's browsing before they sent this enquiry, fetched on open. */
export function LeadJourneyView({ leadId }: { leadId: string }) {
  const { dict } = useT();
  const t = dict.leads;
  const [journey, setJourney] = useState<LeadJourney | null | undefined>(undefined);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let live = true;
    getLeadJourney(leadId)
      .then((j) => live && setJourney(j))
      .catch(() => live && setJourney(null));
    return () => {
      live = false;
    };
  }, [leadId]);

  const LABEL = {
    page_view: dict.overview.pageViewed,
    product_view: dict.overview.productViewed,
    product_click: dict.overview.productClicked,
  } as const;
  const pathLabels = {
    home: dict.overview.pathHome,
    category: dict.overview.pathCategory,
    product: dict.overview.pathProduct,
  };

  return (
    <div>
      <p className="eyebrow mb-1.5">{t.journeyTitle}</p>
      {journey === undefined ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      ) : !journey || journey.steps.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.journeyEmpty}</p>
      ) : (
        <>
          <p className="mb-3 whitespace-normal text-xs text-muted-foreground">
            {journey.visits} {journey.visits === 1 ? t.journeyVisitsOne : t.journeyVisitsOther}
            {" · "}
            {journey.productsViewed} {t.journeyProducts}
            {journey.firstSeen && (
              <>
                {" · "}
                {t.journeyFirstSeen} {shortDate(journey.firstSeen)}
              </>
            )}
            {journey.source && (
              <>
                {" · "}
                {t.journeyFrom} <span className="text-foreground">{journey.source}</span>
              </>
            )}
          </p>
          <ol className="space-y-2.5">
            {(showAll ? journey.steps : journey.steps.slice(-PREVIEW_STEPS)).map((s, i) => {
              const Icon = ICON[s.kind];
              const detail =
                s.kind === "page_view" ? humanizePath(s.detail, pathLabels) : s.detail;
              return (
                <li key={`${s.at}-${i}`} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="size-3" />
                  </span>
                  <div className="min-w-0 flex-1 whitespace-normal">
                    <p className="text-sm">
                      <span className="text-muted-foreground">{LABEL[s.kind]} · </span>
                      {s.productId ? (
                        <Link href={`/products/${s.productId}/edit`} className="font-medium hover:underline">
                          {detail}
                        </Link>
                      ) : (
                        <span className="font-medium">{detail}</span>
                      )}
                      {s.count > 1 && (
                        <span className="ml-1 text-xs tabular-nums text-muted-foreground">
                          ×{s.count}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{shortDate(s.at)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          {!showAll && journey.steps.length > PREVIEW_STEPS && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {t.journeyShowAll.replace("{n}", String(journey.steps.length))}
            </button>
          )}
        </>
      )}
    </div>
  );
}
