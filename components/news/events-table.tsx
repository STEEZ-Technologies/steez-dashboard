"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Pencil, Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";
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
import { deleteNewsEvent, moveNewsEvent } from "@/app/(dashboard)/news/events/actions";
import { useT } from "@/lib/i18n/provider";

export type NewsEventKindValue = "EXHIBITION" | "VISIT" | "PRESS" | "PRODUCT";

export type NewsEventRow = {
  id: string;
  titleEn: string;
  kind: NewsEventKindValue;
  /** Pre-formatted on the server, e.g. "28–30 Oct 2026", "2023", or null. */
  when: string | null;
  upcoming: boolean;
  published: boolean;
};

export function EventsTable({ events }: { events: NewsEventRow[] }) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<NewsEventRow | null>(null);
  const { dict } = useT();
  const t = dict.newsEvents;
  const n = dict.news;

  const kindLabel: Record<NewsEventKindValue, string> = {
    EXHIBITION: t.kindExhibition,
    VISIT: t.kindVisit,
    PRESS: t.kindPress,
    PRODUCT: t.kindProduct,
  };

  function runAction(fn: () => Promise<void>, message: string) {
    startTransition(async () => {
      await fn();
      toast.success(message);
    });
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={t.emptyTitle}
        description={t.emptyDesc}
        action={
          <LinkButton href="/news/events/new">
            <Plus /> {dict.actions.newEvent}
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.colEvent}</TableHead>
            <TableHead className="hidden sm:table-cell">{t.colWhen}</TableHead>
            <TableHead className="hidden sm:table-cell">{t.colKind}</TableHead>
            <TableHead className="hidden sm:table-cell">{n.colStatus}</TableHead>
            <TableHead className="w-[120px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((e, index) => (
            <TableRow key={e.id}>
              <TableCell className="whitespace-normal font-medium">
                {e.titleEn}
                {/* When, type and status, which have their own columns from sm up. */}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-normal text-muted-foreground sm:hidden">
                  <span>{e.when ?? t.undated}</span>
                  <span>· {kindLabel[e.kind]}</span>
                  {e.upcoming && <Badge>{t.upcoming}</Badge>}
                  {!e.published && <Badge variant="outline">{n.draft}</Badge>}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell whitespace-nowrap text-muted-foreground">
                {e.when ?? t.undated}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                {kindLabel[e.kind]}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="flex flex-wrap gap-1">
                  <Badge variant={e.published ? "default" : "outline"}>
                    {e.published ? n.published : n.draft}
                  </Badge>
                  {e.upcoming && <Badge variant="secondary">{t.upcoming}</Badge>}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === 0 || pending}
                    aria-label={dict.actions.moveUp}
                    onClick={() => runAction(() => moveNewsEvent(e.id, "up"), n.toastMovedUp)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === events.length - 1 || pending}
                    aria-label={dict.actions.moveDown}
                    onClick={() => runAction(() => moveNewsEvent(e.id, "down"), n.toastMovedDown)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <LinkButton
                    variant="ghost"
                    size="icon-sm"
                    aria-label={dict.actions.edit}
                    title={dict.actions.edit}
                    href={`/news/events/${e.id}/edit`}
                  >
                    <Pencil className="size-4" />
                  </LinkButton>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={dict.actions.delete}
                    title={dict.actions.delete}
                    onClick={() => setToDelete(e)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dict.actions.delete} &ldquo;{toDelete?.titleEn}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>{t.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = toDelete;
                setToDelete(null);
                if (target) runAction(() => deleteNewsEvent(target.id), t.toastDeleted);
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
