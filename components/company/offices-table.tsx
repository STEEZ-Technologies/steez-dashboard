"use client";

import { useState, useTransition } from "react";
import { MapPin, Pencil, Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyState } from "@/components/shell/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { deleteOffice, moveOffice } from "@/app/(dashboard)/company/actions";
import { useT } from "@/lib/i18n/provider";

export type OfficeRow = {
  id: string;
  nameEn: string;
  nameZh: string | null;
  addressEn: string;
  showMap: boolean;
  published: boolean;
};

export function OfficesTable({ offices, canEdit }: { offices: OfficeRow[]; canEdit: boolean }) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<OfficeRow | null>(null);
  const { dict, locale } = useT();
  const t = dict.company;
  const r = dict.resources;
  const nameOf = (o: OfficeRow) => (locale === "zh" && o.nameZh ? o.nameZh : o.nameEn);

  function runAction(fn: () => Promise<void>, message: string) {
    startTransition(async () => {
      await fn();
      toast.success(message);
    });
  }

  if (offices.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title={t.emptyTitle}
        description={t.emptyDesc}
        action={
          canEdit ? (
            <LinkButton href="/company/offices/new">
              <Plus /> {t.newOffice}
            </LinkButton>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.colOffice}</TableHead>
            <TableHead className="hidden sm:table-cell">{t.colMap}</TableHead>
            <TableHead className="hidden sm:table-cell">{r.colStatus}</TableHead>
            <TableHead className="w-[130px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offices.map((o, index) => (
            <TableRow key={o.id}>
              <TableCell className="whitespace-normal">
                <div className="font-medium">{nameOf(o)}</div>
                <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{o.addressEn}</div>
                {/* Map and status, which have their own columns from sm up. */}
                <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                  {o.showMap && <Badge variant="secondary">{t.hasMap}</Badge>}
                  {!o.published && <Badge variant="outline">{r.draft}</Badge>}
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {o.showMap ? t.hasMap : t.noMap}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant={o.published ? "default" : "outline"}>
                  {o.published ? r.published : r.draft}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {canEdit && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={index === 0 || pending}
                        aria-label={dict.actions.moveUp}
                        onClick={() => runAction(() => moveOffice(o.id, "up"), r.toastMovedUp)}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={index === offices.length - 1 || pending}
                        aria-label={dict.actions.moveDown}
                        onClick={() => runAction(() => moveOffice(o.id, "down"), r.toastMovedDown)}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                    </>
                  )}
                  <LinkButton
                    variant="ghost"
                    size="icon-sm"
                    aria-label={dict.actions.edit}
                    title={dict.actions.edit}
                    href={`/company/offices/${o.id}/edit`}
                  >
                    <Pencil className="size-4" />
                  </LinkButton>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={dict.actions.delete}
                      title={dict.actions.delete}
                      onClick={() => setToDelete(o)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dict.actions.delete} &ldquo;{toDelete ? nameOf(toDelete) : ""}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>{t.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = toDelete;
                setToDelete(null);
                if (target) runAction(() => deleteOffice(target.id), t.toastDeleted);
              }}
            >
              {dict.actions.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
