"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

export type DeletedRow = {
  id: string; // the revision holding the item's last state
  entity: string;
  label: string;
  who: string | null;
  deletedAt: string; // ISO
};

export function RecentlyDeleted({ rows, days }: { rows: DeletedRow[]; days: number }) {
  const { dict, locale } = useT();
  const t = dict.history;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<DeletedRow | null>(null);

  const type = (e: string) =>
    e === "product" ? t.typeProduct
    : e === "article" ? t.typeArticle
    : e === "guide" ? t.typeGuide
    : t.typeCategory;
  const when = (iso: string) =>
    new Date(iso).toLocaleString(locale === "zh" ? "zh-CN" : undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div>
      <h2 className="text-lg font-semibold">{t.deletedTitle}</h2>
      <p className="mt-1 mb-3 text-sm text-muted-foreground">
        {t.deletedDesc.replace("{n}", String(days))}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.deletedEmpty}</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium">{row.label}</span>
                  <Badge variant="secondary">{type(row.entity)}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {when(row.deletedAt)}
                  {row.who ? ` · ${t.by.replace("{who}", row.who)}` : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => setTarget(row)}
              >
                <RotateCcw data-icon="inline-start" />
                {t.restore}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.undeleteTitle.replace("{name}", target?.label ?? "")}</AlertDialogTitle>
            <AlertDialogDescription>{t.undeleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              onClick={() => {
                const row = target;
                setTarget(null);
                if (!row) return;
                startTransition(async () => {
                  const res = await restoreVersion(row.id);
                  if (res.ok) {
                    toast.success(t.restored);
                    router.refresh();
                  } else {
                    toast.error(res.error);
                  }
                });
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
