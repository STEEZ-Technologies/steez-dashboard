"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useT } from "@/lib/i18n/provider";
import { restoreVersion } from "@/app/(dashboard)/history/actions";

export type HistoryChange = { field: string; label: string; now: string; then: string };

export type HistoryRow = {
  id: string;
  action: string;
  who: string | null;
  createdAt: string; // ISO — formatted in the browser so it reads in local time
  live: boolean;
  changes: HistoryChange[];
};

function useWhen() {
  const { locale } = useT();
  return (iso: string) =>
    new Date(iso).toLocaleString(locale === "zh" ? "zh-CN" : undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
}

export function HistoryList({
  rows,
  currentIsLive,
  liveUnknown,
}: {
  rows: HistoryRow[];
  currentIsLive: boolean;
  liveUnknown: boolean;
}) {
  const { dict } = useT();
  const t = dict.history;
  const when = useWhen();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<HistoryRow | null>(null);

  const actionLabel = (a: string) =>
    a === "child" ? t.beforeChild
    : a === "restore" ? t.beforeRestore
    : a === "delete" ? t.beforeDelete
    : t.beforeUpdate;

  function restore(row: HistoryRow) {
    startTransition(async () => {
      const res = await restoreVersion(row.id);
      if (res.ok) {
        // A full reload, not router.refresh(): the edit form above reads its
        // values once, as defaults, so a soft refresh left it showing the
        // replaced text — and saving it would have undone the restore.
        const url = new URL(window.location.href);
        url.searchParams.set("flash", t.restored);
        window.location.assign(url.toString());
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
        <span className="text-sm font-medium">{t.current}</span>
        {currentIsLive && <Badge>{t.live}</Badge>}
      </div>

      {liveUnknown && <p className="text-xs text-muted-foreground">{t.liveUnknown}</p>}

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ol className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-lg border px-3 py-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{when(row.createdAt)}</span>
                    {row.live && <Badge>{t.live}</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {actionLabel(row.action)}
                    {row.who ? ` · ${t.by.replace("{who}", row.who)}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending || row.changes.length === 0}
                  onClick={() => setTarget(row)}
                >
                  <RotateCcw data-icon="inline-start" />
                  {t.restore}
                </Button>
              </div>

              {row.changes.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">{t.same}</p>
              ) : (
                <details className="group mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground select-none hover:text-foreground">
                    {(row.changes.length === 1 ? t.diffOne : t.diffOther).replace(
                      "{n}",
                      String(row.changes.length),
                    )}
                  </summary>
                  <dl className="mt-2 space-y-2">
                    {row.changes.map((c) => (
                      <div key={c.field} className="rounded-md bg-muted/40 p-2 text-xs">
                        <dt className="font-medium">{c.label}</dt>
                        <dd className="mt-1 grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-x-3">
                          <span className="text-muted-foreground">{t.then}</span>
                          <span className="break-words">{c.then}</span>
                          <span className="text-muted-foreground">{t.now}</span>
                          <span className="break-words text-muted-foreground">{c.now}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
            </li>
          ))}
        </ol>
      )}

      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.restoreTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {target ? t.restoreDesc.replace("{when}", when(target.createdAt)) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              onClick={() => {
                const row = target;
                setTarget(null);
                if (row) restore(row);
              }}
            >
              {t.restore}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
